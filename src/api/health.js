import apiClient, { USE_MOCKS } from './client';
import { delay } from '../mocks/mockStorage';

/**
 * GET /api/health
 * Verifica el estado operativo del servicio backend y su conexión con PostgreSQL.
 */
export async function getHealth() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/health');
    return data;
  }

  await delay(80);
  return {
    status: 'UP',
    service: 'yokai-hardware-api',
    database: 'UP',
    timestamp: new Date().toISOString(),
  };
}
