import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  getCarritoRemoto,
  addOrSyncItemCarritoRemoto,
  updateItemCarritoRemoto,
  removeItemCarritoRemoto,
  clearCarritoRemoto,
} from '../api/carrito';

const LOCAL_CART_KEY = 'yokai_local_cart_v1';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, usuario } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [serverTotals, setServerTotals] = useState(null);
  const [syncingCart, setSyncingCart] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [cartError, setCartError] = useState(null);
  const [stockConflict, setStockConflict] = useState(null);

  const reportStockConflict = useCallback((conflict) => {
    if (!conflict) {
      setStockConflict(null);
      return;
    }
    setStockConflict({
      message: conflict.message || 'Stock insuficiente para uno o más productos.',
      productName: conflict.productName || '',
    });
  }, []);

  const clearStockConflict = useCallback(() => {
    setStockConflict(null);
  }, []);

  const applyCarritoDto = useCallback((dto) => {
    if (!dto || !Array.isArray(dto.items)) return;
    setItems(dto.items);
    setServerTotals({
      cantidadTotal: Number(dto.cantidadTotal ?? 0),
      total: Number(dto.total ?? 0),
    });
  }, []);

  // Persistir copia local en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
    } catch {
      // Ignorar fallo de cuota en localStorage
    }
  }, [items]);

  // Carga y sincronización del carrito con el backend (/api/carrito)
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !usuario?.id) {
      setServerTotals(null);
      setCartError(null);
      return null;
    }
    setSyncingCart(true);
    setCartError(null);
    try {
      const remoteDto = await getCarritoRemoto();
      // Si el carrito del servidor está vacío pero había ítems previos en local (sin id de servidor), sincronizarlos
      const localUnmerged = items.filter((entry) => !entry.id && entry.producto?.id);
      if (
        remoteDto &&
        Array.isArray(remoteDto.items) &&
        remoteDto.items.length === 0 &&
        localUnmerged.length > 0
      ) {
        let latestDto = remoteDto;
        for (const entry of localUnmerged) {
          latestDto = await addOrSyncItemCarritoRemoto({
            productoId: entry.producto.id,
            cantidad: entry.cantidad,
            reconcile: true,
          });
        }
        applyCarritoDto(latestDto);
        return latestDto;
      } else if (remoteDto && Array.isArray(remoteDto.items)) {
        applyCarritoDto(remoteDto);
        return remoteDto;
      }
      return remoteDto;
    } catch (err) {
      setCartError(
        err?.message || 'No se pudo obtener el carrito desde el servidor.'
      );
      return null;
    } finally {
      setSyncingCart(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, usuario?.id, applyCarritoDto]);

  // Ejecuta una operación remota del carrito: aplica la respuesta del servidor, informa
  // el error en español y resincroniza si algo falla.
  const runRemote = useCallback(
    (promise) => {
      setPendingOps((n) => n + 1);
      return promise
        .then((dto) => applyCarritoDto(dto))
        .catch((err) => {
          showToast(
            err?.message || 'No se pudo actualizar el carrito. Intentá nuevamente.',
            'error'
          );
          return fetchCart();
        })
        .finally(() => setPendingOps((n) => Math.max(0, n - 1)));
    },
    [applyCarritoDto, fetchCart, showToast]
  );

  useEffect(() => {
    if (isAuthenticated && usuario?.id) {
      fetchCart();
    } else {
      setServerTotals(null);
      setCartError(null);
    }
  }, [isAuthenticated, usuario?.id, fetchCart]);

  /**
   * Agrega un producto al carrito validando disponibilidad y sincronizando con POST /api/carrito/items
   */
  const addToCart = useCallback(
    (producto, cantidadDeseada = 1) => {
      const stockDisponible = Number(producto?.stock ?? 0);
      if (stockDisponible <= 0 || producto?.estadoStock === 'Sin stock') {
        return {
          ok: false,
          message: `Sin stock disponible para "${producto.nombre}".`,
        };
      }

      const qtyToAdd = Math.max(1, Number(cantidadDeseada) || 1);
      const existing = items.find((i) => Number(i.producto.id) === Number(producto.id));
      const currentQty = existing ? Number(existing.cantidad) : 0;

      if (currentQty >= stockDisponible) {
        return {
          ok: false,
          message: `Ya tenés el máximo de stock disponible (${stockDisponible} u.) en tu carrito.`,
        };
      }

      const finalQty = Math.min(currentQty + qtyToAdd, stockDisponible);
      const adjusted = currentQty + qtyToAdd > stockDisponible;
      const effectiveDelta = finalQty - currentQty;

      setItems((prev) => {
        const idx = prev.findIndex((i) => Number(i.producto.id) === Number(producto.id));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            producto,
            cantidad: finalQty,
            subtotal: Number(producto.precio || 0) * finalQty,
          };
          return updated;
        }
        return [
          ...prev,
          {
            producto,
            cantidad: finalQty,
            subtotal: Number(producto.precio || 0) * finalQty,
          },
        ];
      });

      if (isAuthenticated && effectiveDelta > 0) {
        runRemote(
          addOrSyncItemCarritoRemoto({
            productoId: producto.id,
            cantidad: effectiveDelta,
          })
        );
      }

      return {
        ok: true,
        message: adjusted
          ? `Se ajustó al stock máximo disponible (${stockDisponible} u.).`
          : `Se agregó "${producto.nombre}" al carrito.`,
      };
    },
    [items, isAuthenticated, runRemote]
  );

  /**
   * Modifica la cantidad de un ítem usando PUT /api/carrito/items/{id}
   */
  const updateQuantity = useCallback(
    (productoId, nuevaCantidad) => {
      const targetItem = items.find(
        (i) => Number(i.producto.id) === Number(productoId) || Number(i.id) === Number(productoId)
      );
      if (!targetItem) return { ok: false, message: '' };

      setStockConflict(null);

      const maxStock = Number(targetItem.producto.stock ?? 0);
      const qty = Number(nuevaCantidad);

      if (qty <= 0) {
        setItems((prev) =>
          prev.filter((i) => Number(i.producto.id) !== Number(targetItem.producto.id))
        );
        if (isAuthenticated && targetItem.id) {
          runRemote(
            removeItemCarritoRemoto({
              itemId: targetItem.id,
              productoId: targetItem.producto.id,
            })
          );
        }
        return { ok: true, message: '' };
      }

      const clampedQty = Math.min(qty, maxStock);
      const result =
        qty > maxStock
          ? {
              ok: false,
              message: `Solo hay ${maxStock} unidad(es) en stock de "${targetItem.producto.nombre}".`,
            }
          : { ok: true, message: '' };

      setItems((prev) =>
        prev.map((i) =>
          Number(i.producto.id) === Number(targetItem.producto.id)
            ? {
                ...i,
                cantidad: clampedQty,
                subtotal: Number(i.producto.precio || 0) * clampedQty,
              }
            : i
        )
      );

      if (isAuthenticated) {
        const updatePromise = targetItem.id
          ? updateItemCarritoRemoto({
              itemId: targetItem.id,
              productoId: targetItem.producto.id,
              cantidad: clampedQty,
            })
          : addOrSyncItemCarritoRemoto({
              productoId: targetItem.producto.id,
              cantidad: clampedQty,
              reconcile: true,
            });

        runRemote(updatePromise);
      }

      return result;
    },
    [items, isAuthenticated, runRemote]
  );

  /**
   * Elimina un ítem del carrito usando DELETE /api/carrito/items/{id}
   */
  const removeFromCart = useCallback(
    (productoId) => {
      const targetItem = items.find(
        (i) => Number(i.producto.id) === Number(productoId) || Number(i.id) === Number(productoId)
      );
      setStockConflict(null);
      setItems((prev) =>
        prev.filter((i) => Number(i.producto.id) !== Number(productoId))
      );

      if (isAuthenticated && targetItem) {
        if (targetItem.id) {
          runRemote(
            removeItemCarritoRemoto({
              itemId: targetItem.id,
              productoId: targetItem.producto.id,
            })
          );
        } else {
          fetchCart();
        }
      }
    },
    [items, isAuthenticated, runRemote, fetchCart]
  );

  /**
   * Vacía únicamente el estado local del carrito (por ejemplo, tras confirmar un pedido
   * donde POST /api/pedidos ya vació el carrito en la base de datos).
   */
  const clearLocalCart = useCallback(() => {
    setItems([]);
    setServerTotals({ cantidadTotal: 0, total: 0 });
    setStockConflict(null);
    localStorage.removeItem(LOCAL_CART_KEY);
  }, []);

  /**
   * Vacía el carrito usando DELETE /api/carrito
   */
  const clearCart = useCallback(() => {
    clearLocalCart();
    if (isAuthenticated) {
      runRemote(clearCarritoRemoto());
    }
  }, [isAuthenticated, runRemote, clearLocalCart]);

  const totalItems = useMemo(() => {
    if (isAuthenticated && serverTotals !== null && items.every((i) => i.id)) {
      return serverTotals.cantidadTotal;
    }
    return items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  }, [items, isAuthenticated, serverTotals]);

  const subtotal = useMemo(() => {
    if (isAuthenticated && serverTotals !== null && items.every((i) => i.id)) {
      return serverTotals.total;
    }
    return items.reduce(
      (acc, item) =>
        acc +
        Number(
          item.subtotal !== undefined
            ? item.subtotal
            : Number(item.producto?.precio || 0) * Number(item.cantidad || 0)
        ),
      0
    );
  }, [items, isAuthenticated, serverTotals]);

  return (
    <CartContext.Provider
      value={{
        items,
        syncingCart,
        cartBusy: syncingCart || pendingOps > 0,
        cartError,
        stockConflict,
        reportStockConflict,
        clearStockConflict,
        fetchCart,
        totalItems,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        clearLocalCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe utilizarse dentro de un CartProvider');
  }
  return ctx;
}
