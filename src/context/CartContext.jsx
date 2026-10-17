import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getCarritoRemoto,
  addOrSyncItemCarritoRemoto,
  updateItemCarritoRemoto,
  deleteCarritoRemoto,
} from '../api/carrito';

const LOCAL_CART_KEY = 'yokai_local_cart_v1';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, usuario } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [syncingCart, setSyncingCart] = useState(false);

  // Persistir siempre en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Error guardando carrito en localStorage:', err);
    }
  }, [items]);

  // Al iniciar sesión, sincronizar el carrito local con el backend (/api/carrito)
  useEffect(() => {
    let active = true;
    async function syncWithBackend() {
      if (!isAuthenticated || !usuario?.id) return;
      setSyncingCart(true);
      try {
        const localSnapshot = [...items];
        if (localSnapshot.length > 0) {
          for (const entry of localSnapshot) {
            await addOrSyncItemCarritoRemoto({
              productoId: entry.producto.id,
              cantidad: entry.cantidad,
              reconcile: true,
            });
          }
        }
        const remoteItems = await getCarritoRemoto();
        if (active && Array.isArray(remoteItems) && remoteItems.length > 0) {
          setItems(remoteItems);
        }
      } catch (err) {
        console.warn('No se pudo sincronizar carrito remoto, manteniendo copia local:', err);
      } finally {
        if (active) setSyncingCart(false);
      }
    }

    syncWithBackend();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, usuario?.id]);

  /**
   * Agrega un producto al carrito validando que la cantidad total no supere el stock disponible.
   * Devuelve { ok: boolean, message: string }
   */
  const addToCart = useCallback(
    (producto, cantidadDeseada = 1) => {
      const stockDisponible = Number(producto?.stock ?? 0);
      if (stockDisponible <= 0) {
        return {
          ok: false,
          message: `Sin stock disponible para "${producto.nombre}".`,
        };
      }

      const qtyToAdd = Math.max(1, Number(cantidadDeseada) || 1);
      let statusResult = {
        ok: true,
        message: `Se agregó "${producto.nombre}" al carrito.`,
      };

      setItems((prev) => {
        const idx = prev.findIndex((i) => Number(i.producto.id) === Number(producto.id));
        const currentQty = idx >= 0 ? prev[idx].cantidad : 0;

        if (currentQty + qtyToAdd > stockDisponible) {
          const maxPossible = stockDisponible;
          statusResult = {
            ok: currentQty < stockDisponible,
            message:
              currentQty >= stockDisponible
                ? `Ya tenés el máximo de stock disponible (${stockDisponible} u.) en tu carrito.`
                : `Se ajustó al stock máximo disponible (${stockDisponible} u.).`,
          };
          if (currentQty >= stockDisponible) return prev;

          const updated = [...prev];
          updated[idx] = { producto, cantidad: maxPossible };
          return updated;
        }

        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            producto,
            cantidad: currentQty + qtyToAdd,
          };
          return updated;
        }

        return [...prev, { producto, cantidad: qtyToAdd }];
      });

      if (isAuthenticated && statusResult.ok) {
        addOrSyncItemCarritoRemoto({
          productoId: producto.id,
          cantidad: qtyToAdd,
        }).catch(() => {});
      }

      return statusResult;
    },
    [isAuthenticated]
  );

  /**
   * Modifica la cantidad de un ítem validando límites [1, stock]
   */
  const updateQuantity = useCallback(
    (productoId, nuevaCantidad) => {
      let result = { ok: true, message: '' };
      setItems((prev) => {
        const idx = prev.findIndex((i) => Number(i.producto.id) === Number(productoId));
        if (idx === -1) return prev;

        const item = prev[idx];
        const maxStock = Number(item.producto.stock ?? 0);
        const qty = Number(nuevaCantidad);

        if (qty <= 0) {
          return prev.filter((i) => Number(i.producto.id) !== Number(productoId));
        }

        if (qty > maxStock) {
          result = {
            ok: false,
            message: `Solo hay ${maxStock} unidad(es) en stock de "${item.producto.nombre}".`,
          };
          const updated = [...prev];
          updated[idx] = { ...item, cantidad: maxStock };
          return updated;
        }

        const updated = [...prev];
        updated[idx] = { ...item, cantidad: qty };
        return updated;
      });

      if (isAuthenticated) {
        updateItemCarritoRemoto({
          productoId,
          cantidad: nuevaCantidad,
        }).catch(() => {});
      }

      return result;
    },
    [isAuthenticated]
  );

  const removeFromCart = useCallback(
    (productoId) => {
      setItems((prev) =>
        prev.filter((i) => Number(i.producto.id) !== Number(productoId))
      );
      if (isAuthenticated) {
        deleteCarritoRemoto(productoId).catch(() => {});
      }
    },
    [isAuthenticated]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(LOCAL_CART_KEY);
    if (isAuthenticated) {
      deleteCarritoRemoto().catch(() => {});
    }
  }, [isAuthenticated]);

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.cantidad || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + Number(item.producto.precio || 0) * Number(item.cantidad || 0),
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        syncingCart,
        totalItems,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
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
