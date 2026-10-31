import apiClient, { ApiError, USE_MOCKS } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';

/**
 * GET /api/categorias
 */
export async function getCategorias() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/categorias');
    return data;
  }

  await delay(140);
  const categorias = mockStorage.getCategorias();
  const productos = mockStorage.getProductos();

  return categorias.map((cat) => {
    const countReal = productos.filter(
      (p) => String(p.categoria).toLowerCase() === String(cat.nombre).toLowerCase()
    ).length;
    return {
      ...cat,
      stockModelos: countReal,
    };
  });
}

/**
 * GET /api/categorias/{id}
 */
export async function getCategoriaById(id) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get(`/api/categorias/${id}`);
    return data;
  }

  await delay(120);
  const found = mockStorage.getCategorias().find((c) => Number(c.id) === Number(id));
  if (!found) {
    throw new ApiError({
      message: 'La categoría solicitada no fue encontrada.',
      status: 404,
    });
  }
  return found;
}

/**
 * POST /api/categorias (ADMIN)
 */
export async function createCategoria(payload) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/api/categorias', payload);
    return data;
  }

  await delay(200);
  const categorias = mockStorage.getCategorias();
  const nombreNorm = String(payload.nombre || '').trim().toLowerCase();
  if (categorias.some((c) => String(c.nombre).trim().toLowerCase() === nombreNorm)) {
    throw new ApiError({
      message: 'Ya existe una categoría con ese nombre.',
      status: 409,
    });
  }

  const nuevoId = categorias.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1;
  const nueva = {
    id: nuevoId,
    slug: String(payload.nombre || '').trim(),
    nombre: String(payload.nombre || '').trim(),
    subtitulo: String(payload.subtitulo || 'Componentes').trim(),
    kanji: payload.kanji || '霊',
    icono: payload.icono || 'memory',
    acento: payload.acento || 'gold',
    descripcion: String(payload.descripcion || '').trim(),
    modelosCount: Number(payload.modelosCount) || 10,
  };
  categorias.push(nueva);
  mockStorage.saveCategorias(categorias);
  return nueva;
}

/**
 * PUT /api/categorias/{id} (ADMIN)
 */
export async function updateCategoria(id, payload) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.put(`/api/categorias/${id}`, payload);
    return data;
  }

  await delay(200);
  const categorias = mockStorage.getCategorias();
  const idx = categorias.findIndex((c) => Number(c.id) === Number(id));
  if (idx === -1) {
    throw new ApiError({
      message: 'Categoría no encontrada.',
      status: 404,
    });
  }

  categorias[idx] = {
    ...categorias[idx],
    ...payload,
    id: categorias[idx].id,
    slug: payload.nombre ? String(payload.nombre).trim() : categorias[idx].slug,
  };
  mockStorage.saveCategorias(categorias);
  return categorias[idx];
}

/**
 * DELETE /api/categorias/{id} (ADMIN)
 */
export async function deleteCategoria(id) {
  if (!USE_MOCKS) {
    await apiClient.delete(`/api/categorias/${id}`);
    return { deleted: true };
  }

  await delay(200);
  const categorias = mockStorage.getCategorias();
  mockStorage.saveCategorias(categorias.filter((c) => Number(c.id) !== Number(id)));
  return { deleted: true };
}
