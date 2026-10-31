import apiClient from './client';

/**
 * GET /api/productos?categoria=&marca=&precioMin=&precioMax=&q=&disponibilidad=&orden=&page=&size=
 * -> { content: [], totalPages, totalElements, page, size }
 */
export async function getProductos(params = {}) {
  const {
    categoria = '',
    marca = '',
    precioMin = '',
    precioMax = '',
    q = '',
    disponibilidad = '',
    orden = '',
    page = 0,
    size = 8,
  } = params;

  const cleanParams = {};
  if (categoria) cleanParams.categoria = categoria;
  if (marca) cleanParams.marca = marca;
  if (precioMin !== '' && precioMin !== null) cleanParams.precioMin = precioMin;
  if (precioMax !== '' && precioMax !== null) cleanParams.precioMax = precioMax;
  if (q) cleanParams.q = q;
  if (disponibilidad) cleanParams.disponibilidad = disponibilidad;
  if (orden) cleanParams.orden = orden;
  cleanParams.page = page;
  cleanParams.size = size;

  const { data } = await apiClient.get('/api/productos', { params: cleanParams });
  return data;
}

/**
 * GET /api/productos/{id}
 */
export async function getProductoById(id) {
  const { data } = await apiClient.get(`/api/productos/${id}`);
  return data;
}

/**
 * POST /api/productos (ADMIN)
 */
export async function createProducto(payload) {
  const { data } = await apiClient.post('/api/productos', payload);
  return data;
}

/**
 * PUT /api/productos/{id} (ADMIN)
 */
export async function updateProducto(id, payload) {
  const { data } = await apiClient.put(`/api/productos/${id}`, payload);
  return data;
}

/**
 * DELETE /api/productos/{id} (ADMIN)
 */
export async function deleteProducto(id) {
  await apiClient.delete(`/api/productos/${id}`);
  return { deleted: true };
}
