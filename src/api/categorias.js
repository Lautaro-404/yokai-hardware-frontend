import apiClient from './client';

/**
 * GET /api/categorias
 */
export async function getCategorias() {
  const { data } = await apiClient.get('/api/categorias');
  return data;
}

/**
 * GET /api/categorias/{id}
 */
export async function getCategoriaById(id) {
  const { data } = await apiClient.get(`/api/categorias/${id}`);
  return data;
}

/**
 * POST /api/categorias (ADMIN)
 */
export async function createCategoria(payload) {
  const { data } = await apiClient.post('/api/categorias', payload);
  return data;
}

/**
 * PUT /api/categorias/{id} (ADMIN)
 */
export async function updateCategoria(id, payload) {
  const { data } = await apiClient.put(`/api/categorias/${id}`, payload);
  return data;
}

/**
 * DELETE /api/categorias/{id} (ADMIN)
 */
export async function deleteCategoria(id) {
  await apiClient.delete(`/api/categorias/${id}`);
  return { deleted: true };
}
