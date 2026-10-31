import apiClient, { ApiError, USE_MOCKS } from './client';
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

/**
 * GET /api/marcas/{id}
 */
export async function getMarcaById(id) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get(`/api/marcas/${id}`);
    return data;
  }

  await delay(100);
  const found = mockStorage.getMarcas().find((m) => Number(m.id) === Number(id));
  if (!found) {
    throw new ApiError({
      message: 'La marca solicitada no fue encontrada.',
      status: 404,
    });
  }
  return found;
}

/**
 * POST /api/marcas (ADMIN)
 */
export async function createMarca(payload) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/api/marcas', payload);
    return data;
  }

  await delay(180);
  const marcas = mockStorage.getMarcas();
  const nombre = String(payload?.nombre || '').trim();
  if (marcas.some((m) => String(m.nombre).toLowerCase() === nombre.toLowerCase())) {
    throw new ApiError({
      message: 'Ya existe una marca registrada con ese nombre.',
      status: 409,
    });
  }
  const nuevoId = marcas.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
  const nueva = { id: nuevoId, nombre };
  marcas.push(nueva);
  mockStorage.saveMarcas(marcas);
  return nueva;
}

/**
 * PUT /api/marcas/{id} (ADMIN)
 */
export async function updateMarca(id, payload) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.put(`/api/marcas/${id}`, payload);
    return data;
  }

  await delay(180);
  const marcas = mockStorage.getMarcas();
  const idx = marcas.findIndex((m) => Number(m.id) === Number(id));
  if (idx === -1) {
    throw new ApiError({
      message: 'Marca no encontrada.',
      status: 404,
    });
  }
  marcas[idx] = {
    ...marcas[idx],
    nombre: String(payload?.nombre || marcas[idx].nombre).trim(),
  };
  mockStorage.saveMarcas(marcas);
  return marcas[idx];
}

/**
 * DELETE /api/marcas/{id} (ADMIN)
 */
export async function deleteMarca(id) {
  if (!USE_MOCKS) {
    await apiClient.delete(`/api/marcas/${id}`);
    return { deleted: true };
  }

  await delay(180);
  const marcas = mockStorage.getMarcas();
  mockStorage.saveMarcas(marcas.filter((m) => Number(m.id) !== Number(id)));
  return { deleted: true };
}
