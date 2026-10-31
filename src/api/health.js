import apiClient from './client';

/**
 * GET /api/health
 * Verifica el estado operativo del servicio backend y su conexión con PostgreSQL.
 */
export async function getHealth() {
  const { data } = await apiClient.get('/api/health');
  return data;
}
