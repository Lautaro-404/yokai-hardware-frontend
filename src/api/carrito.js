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

/**
 * GET /api/carrito
 */
export async function getCarritoRemoto() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/carrito');
    return data;
  }

  await delay(120);
  const userId = getCurrentMockUserId();
  return mockStorage.getServerCart(userId);
}

/**
 * POST /api/carrito -> Agrega o sincroniza un ítem en el carrito del backend
 */
export async function addOrSyncItemCarritoRemoto({
  productoId,
  cantidad,
  reconcile = false,
}) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/api/carrito', { productoId, cantidad });
    return data;
  }

  await delay(120);
  const userId = getCurrentMockUserId();
  const productos = mockStorage.getProductos();
  const prod = productos.find((p) => Number(p.id) === Number(productoId));
  if (!prod) return mockStorage.getServerCart(userId);

  const current = mockStorage.getServerCart(userId);
  const idx = current.findIndex((item) => Number(item.producto.id) === Number(productoId));
  const safeQty = Math.min(Math.max(1, Number(cantidad)), Number(prod.stock));

  if (idx >= 0) {
    current[idx].cantidad = reconcile
      ? safeQty
      : Math.min(current[idx].cantidad + safeQty, Number(prod.stock));
    current[idx].producto = prod;
  } else if (safeQty > 0) {
    current.push({ producto: prod, cantidad: safeQty });
  }

  mockStorage.saveServerCart(userId, current);
  return current;
}

/**
 * PUT /api/carrito -> Actualiza la cantidad de un producto en el carrito remoto
 */
export async function updateItemCarritoRemoto({ productoId, cantidad }) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.put('/api/carrito', { productoId, cantidad });
    return data;
  }

  await delay(100);
  const userId = getCurrentMockUserId();
  const productos = mockStorage.getProductos();
  const prod = productos.find((p) => Number(p.id) === Number(productoId));
  const current = mockStorage.getServerCart(userId);
  const idx = current.findIndex((item) => Number(item.producto.id) === Number(productoId));

  if (idx >= 0 && prod) {
    current[idx].cantidad = Math.min(Math.max(1, Number(cantidad)), Number(prod.stock));
    current[idx].producto = prod;
  }

  mockStorage.saveServerCart(userId, current);
  return current;
}

/**
 * DELETE /api/carrito -> Vacía el carrito o elimina un producto específico
 */
export async function deleteCarritoRemoto(productoId = null) {
  if (!USE_MOCKS) {
    const config = productoId ? { params: { productoId } } : undefined;
    const { data } = await apiClient.delete('/api/carrito', config);
    return data;
  }

  await delay(100);
  const userId = getCurrentMockUserId();
  if (!productoId) {
    mockStorage.saveServerCart(userId, []);
    return [];
  }

  const current = mockStorage
    .getServerCart(userId)
    .filter((item) => Number(item.producto.id) !== Number(productoId));
  mockStorage.saveServerCart(userId, current);
  return current;
}
