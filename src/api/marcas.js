import apiClient, { USE_MOCKS } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';

/**
 * GET /api/marcas
 */
export async function getMarcas() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/marcas');
    return data;
  }

  await delay(120);
  return mockStorage.getMarcas();
}
