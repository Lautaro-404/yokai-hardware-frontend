import apiClient from './client';

/**
 * GET /api/marcas
 */
export async function getMarcas() {
  const { data } = await apiClient.get('/api/marcas');
  return data;
}

/**
 * GET /api/marcas/{id}
 */
export async function getMarcaById(id) {
  const { data } = await apiClient.get(`/api/marcas/${id}`);
  return data;
}

/**
 * POST /api/marcas (ADMIN)
 */
export async function createMarca(payload) {
  const { data } = await apiClient.post('/api/marcas', payload);
  return data;
}

/**
 * PUT /api/marcas/{id} (ADMIN)
 */
export async function updateMarca(id, payload) {
  const { data } = await apiClient.put(`/api/marcas/${id}`, payload);
  return data;
}

/**
 * DELETE /api/marcas/{id} (ADMIN)
 */
export async function deleteMarca(id) {
  await apiClient.delete(`/api/marcas/${id}`);
  return { deleted: true };
}
