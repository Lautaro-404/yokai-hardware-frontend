import apiClient, { USE_MOCKS, USER_STORAGE_KEY } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';

function getCurrentMockUserId() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return 'guest';
    const parsed = JSON.parse(raw);
    return parsed?.id || 'guest';
  } catch {
    return 'guest';
  }
}

function buildMockCarritoDto(rawItems = []) {
  const items = rawItems.map((entry, idx) => {
    const precio = Number(entry.producto?.precio || 0);
    const cantidad = Number(entry.cantidad || 0);
    return {
      id: entry.id || Number(entry.producto?.id) || idx + 1,
      producto: entry.producto,
      cantidad,
      subtotal: precio * cantidad,
    };
  });
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0);
  const total = items.reduce((acc, i) => acc + i.subtotal, 0);
  return {
    items,
    cantidadTotal,
    total,
  };
}

/**
 * GET /api/carrito
 * Devuelve CarritoDto: { items: [{ id, producto, cantidad, subtotal }], cantidadTotal, total }
 */
export async function getCarritoRemoto() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/carrito');
    return data;
  }

  await delay(120);
  const userId = getCurrentMockUserId();
  return buildMockCarritoDto(mockStorage.getServerCart(userId));
}

/**
 * POST /api/carrito/items -> Agrega un producto al carrito del usuario autenticado
 * Recibe { productoId, cantidad } y devuelve CarritoDto
 */
export async function addOrSyncItemCarritoRemoto({
  productoId,
  cantidad,
  reconcile = false,
}) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/api/carrito/items', {
      productoId: Number(productoId),
      cantidad: Number(cantidad),
    });
    return data;
  }

  await delay(120);
  const userId = getCurrentMockUserId();
  const productos = mockStorage.getProductos();
  const prod = productos.find((p) => Number(p.id) === Number(productoId));
  if (!prod) return buildMockCarritoDto(mockStorage.getServerCart(userId));

  const current = mockStorage.getServerCart(userId);
  const idx = current.findIndex((item) => Number(item.producto.id) === Number(productoId));
  const safeQty = Math.min(Math.max(1, Number(cantidad)), Number(prod.stock));

  if (idx >= 0) {
    current[idx].cantidad = reconcile
      ? safeQty
      : Math.min(current[idx].cantidad + safeQty, Number(prod.stock));
    current[idx].producto = prod;
  } else if (safeQty > 0) {
    current.push({ id: Number(prod.id), producto: prod, cantidad: safeQty });
  }

  mockStorage.saveServerCart(userId, current);
  return buildMockCarritoDto(current);
}

/**
 * PUT /api/carrito/items/{id} -> Fija la cantidad exacta de un ítem del carrito
 * {id} es el ID del CarritoItem en el servidor
 */
export async function updateItemCarritoRemoto({ itemId, productoId, cantidad }) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.put(`/api/carrito/items/${itemId}`, {
      cantidad: Number(cantidad),
    });
    return data;
  }

  await delay(100);
  const userId = getCurrentMockUserId();
  const productos = mockStorage.getProductos();
  const current = mockStorage.getServerCart(userId);
  const idx = current.findIndex(
    (item) =>
      (itemId && Number(item.id) === Number(itemId)) ||
      Number(item.producto.id) === Number(productoId)
  );

  if (idx >= 0) {
    const prod =
      productos.find((p) => Number(p.id) === Number(current[idx].producto.id)) ||
      current[idx].producto;
    current[idx].cantidad = Math.min(Math.max(1, Number(cantidad)), Number(prod.stock));
    current[idx].producto = prod;
  }

  mockStorage.saveServerCart(userId, current);
  return buildMockCarritoDto(current);
}

/**
 * DELETE /api/carrito/items/{id} -> Elimina un ítem específico del carrito
 */
export async function removeItemCarritoRemoto({ itemId, productoId }) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.delete(`/api/carrito/items/${itemId}`);
    return data;
  }

  await delay(100);
  const userId = getCurrentMockUserId();
  const current = mockStorage
    .getServerCart(userId)
    .filter(
      (item) =>
        !(
          (itemId && Number(item.id) === Number(itemId)) ||
          (productoId && Number(item.producto.id) === Number(productoId))
        )
    );
  mockStorage.saveServerCart(userId, current);
  return buildMockCarritoDto(current);
}

/**
 * DELETE /api/carrito -> Vacía por completo el carrito del usuario autenticado
 */
export async function clearCarritoRemoto() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.delete('/api/carrito');
    return data;
  }

  await delay(100);
  const userId = getCurrentMockUserId();
  mockStorage.saveServerCart(userId, []);
  return buildMockCarritoDto([]);
}
