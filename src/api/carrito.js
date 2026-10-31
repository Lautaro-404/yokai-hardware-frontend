import apiClient from './client';

/**
 * GET /api/carrito
 * Devuelve CarritoDto: { items: [{ id, producto, cantidad, subtotal }], cantidadTotal, total }
 */
export async function getCarritoRemoto() {
  const { data } = await apiClient.get('/api/carrito');
  return data;
}

/**
 * POST /api/carrito/items -> Agrega un producto al carrito del usuario autenticado
 * Recibe { productoId, cantidad } y devuelve CarritoDto
 */
export async function addOrSyncItemCarritoRemoto({ productoId, cantidad }) {
  const { data } = await apiClient.post('/api/carrito/items', {
    productoId: Number(productoId),
    cantidad: Number(cantidad),
  });
  return data;
}

/**
 * PUT /api/carrito/items/{id} -> Fija la cantidad exacta de un ítem del carrito
 * {id} es el ID del CarritoItem en el servidor
 */
export async function updateItemCarritoRemoto({ itemId, cantidad }) {
  const { data } = await apiClient.put(`/api/carrito/items/${itemId}`, {
    cantidad: Number(cantidad),
  });
  return data;
}

/**
 * DELETE /api/carrito/items/{id} -> Elimina un ítem específico del carrito
 */
export async function removeItemCarritoRemoto({ itemId }) {
  const { data } = await apiClient.delete(`/api/carrito/items/${itemId}`);
  return data;
}

/**
 * DELETE /api/carrito -> Vacía por completo el carrito del usuario autenticado
 */
export async function clearCarritoRemoto() {
  const { data } = await apiClient.delete('/api/carrito');
  return data;
}
