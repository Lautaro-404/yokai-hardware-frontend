import apiClient, { ApiError, USE_MOCKS } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';
import { DEFAULT_HERO_IMAGE_URL } from '../utils/constants';

function calcularEstadoStockMock(stock, stockMinimo = 3) {
  const existencias = Number(stock ?? 0);
  const minimo = Number(stockMinimo ?? 3);
  if (existencias <= 0) return 'Sin stock';
  if (existencias <= minimo) return 'Últimas unidades';
  return 'En stock';
}

function enrichMockProducto(p) {
  const stock = Math.max(0, Number(p.stock ?? 0));
  const stockMinimo = Math.max(0, Number(p.stockMinimo ?? 3));
  const sku =
    p.sku ||
    `${String(p.categoria || 'PRD')
      .slice(0, 3)
      .toUpperCase()}-000${p.id}`;
  return {
    ...p,
    sku,
    stock,
    stockMinimo,
    estadoStock: p.estadoStock || calcularEstadoStockMock(stock, stockMinimo),
  };
}

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

  if (!USE_MOCKS) {
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

  await delay(220);
  let lista = mockStorage.getProductos().map(enrichMockProducto);

  // Filtro por categoría Yokai
  if (categoria) {
    const catNorm = String(categoria).trim().toLowerCase();
    lista = lista.filter(
      (p) => String(p.categoria || '').trim().toLowerCase() === catNorm
    );
  }

  // Filtro por marca
  if (marca) {
    const marcaNorm = String(marca).trim().toLowerCase();
    lista = lista.filter(
      (p) => String(p.marca || '').trim().toLowerCase() === marcaNorm
    );
  }

  // Filtro por rango de precio
  if (precioMin !== '' && precioMin !== null && !Number.isNaN(Number(precioMin))) {
    lista = lista.filter((p) => Number(p.precio) >= Number(precioMin));
  }
  if (precioMax !== '' && precioMax !== null && !Number.isNaN(Number(precioMax))) {
    lista = lista.filter((p) => Number(p.precio) <= Number(precioMax));
  }

  // Filtro por disponibilidad (EN_STOCK, ULTIMAS_UNIDADES, SIN_STOCK, DISPONIBLE)
  if (disponibilidad) {
    const dispUpper = String(disponibilidad).trim().toUpperCase();
    if (dispUpper === 'EN_STOCK') {
      lista = lista.filter((p) => p.stock > p.stockMinimo);
    } else if (dispUpper === 'ULTIMAS_UNIDADES') {
      lista = lista.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo);
    } else if (dispUpper === 'SIN_STOCK') {
      lista = lista.filter((p) => p.stock <= 0);
    } else if (dispUpper === 'DISPONIBLE') {
      lista = lista.filter((p) => p.stock > 0);
    }
  }

  // Búsqueda por texto (q)
  if (q && String(q).trim() !== '') {
    const query = String(q).trim().toLowerCase();
    lista = lista.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion.toLowerCase().includes(query) ||
        String(p.marca || '').toLowerCase().includes(query) ||
        String(p.categoria || '').toLowerCase().includes(query) ||
        String(p.sku || '').toLowerCase().includes(query) ||
        String(p.subtituloCorto || '').toLowerCase().includes(query)
    );
  }

  // Ordenamiento
  if (orden === 'precio_asc') {
    lista.sort((a, b) => Number(a.precio) - Number(b.precio));
  } else if (orden === 'precio_desc') {
    lista.sort((a, b) => Number(b.precio) - Number(a.precio));
  } else if (orden === 'nombre_asc') {
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  } else if (orden === 'stock_desc') {
    lista.sort((a, b) => Number(b.stock) - Number(a.stock));
  }

  const totalElements = lista.length;
  const pageSize = Math.max(1, Number(size) || 8);
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const currentPage = Math.min(Math.max(0, Number(page) || 0), totalPages - 1);
  const start = currentPage * pageSize;
  const content = lista.slice(start, start + pageSize);

  return {
    content,
    totalPages,
    totalElements,
    page: currentPage,
    size: pageSize,
  };
}

/**
 * GET /api/productos/{id}
 */
export async function getProductoById(id) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get(`/api/productos/${id}`);
    return data;
  }

  await delay(180);
  const productos = mockStorage.getProductos().map(enrichMockProducto);
  const found = productos.find((p) => Number(p.id) === Number(id));
  if (!found) {
    throw new ApiError({
      message: 'El componente solicitado no fue encontrado en el santuario.',
      status: 404,
    });
  }
  return {
    ...found,
    imagenes: found.imagen ? [found.imagen] : [],
  };
}

/**
 * GET /api/admin/productos/stock-bajo (ADMIN)
 */
export async function getProductosStockBajoAdmin() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/admin/productos/stock-bajo');
    return data;
  }

  await delay(160);
  return mockStorage
    .getProductos()
    .map(enrichMockProducto)
    .filter((p) => p.stock <= p.stockMinimo);
}

/**
 * POST /api/productos (ADMIN)
 */
export async function createProducto(payload) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/api/productos', payload);
    return data;
  }

  await delay(260);
  const productos = mockStorage.getProductos();
  const nuevoId = productos.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
  const stock = Math.max(0, Number(payload.stock) || 0);
  const stockMinimo =
    payload.stockMinimo !== undefined && payload.stockMinimo !== ''
      ? Math.max(0, Number(payload.stockMinimo))
      : 3;
  const categoria = payload.categoria || 'Oni';
  const sku =
    payload.sku && String(payload.sku).trim()
      ? String(payload.sku).trim().toUpperCase()
      : `${categoria.slice(0, 3).toUpperCase()}-000${nuevoId}`;

  const nuevo = enrichMockProducto({
    id: nuevoId,
    sku,
    nombre: String(payload.nombre || '').trim(),
    descripcion: String(payload.descripcion || '').trim(),
    precio: Number(payload.precio) || 0,
    stock,
    stockMinimo,
    imagen: payload.imagen || DEFAULT_HERO_IMAGE_URL,
    categoria,
    marca: String(payload.marca || 'ASUS').toUpperCase(),
    etiquetaYokai:
      payload.etiquetaYokai || `${categoria} // ${payload.marca || 'HARDWARE'}`,
    subtituloCorto:
      payload.subtituloCorto || 'Componente oficial certificado • Garantía Oficial Argentina',
    destacado: Boolean(payload.destacado),
    especificaciones: payload.especificaciones || {
      Garantía: 'Oficial en Argentina (12 meses)',
      Estado: 'Nuevo en caja sellada',
    },
  });

  productos.unshift(nuevo);
  mockStorage.saveProductos(productos);
  return nuevo;
}

/**
 * PUT /api/productos/{id} (ADMIN)
 */
export async function updateProducto(id, payload) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.put(`/api/productos/${id}`, payload);
    return data;
  }

  await delay(240);
  const productos = mockStorage.getProductos();
  const idx = productos.findIndex((p) => Number(p.id) === Number(id));
  if (idx === -1) {
    throw new ApiError({
      message: 'Producto no encontrado.',
      status: 404,
    });
  }

  const stock =
    payload.stock !== undefined ? Math.max(0, Number(payload.stock)) : productos[idx].stock;
  const stockMinimo =
    payload.stockMinimo !== undefined && payload.stockMinimo !== ''
      ? Math.max(0, Number(payload.stockMinimo))
      : productos[idx].stockMinimo ?? 3;

  const actualizado = enrichMockProducto({
    ...productos[idx],
    ...payload,
    id: productos[idx].id,
    precio:
      payload.precio !== undefined ? Number(payload.precio) : productos[idx].precio,
    stock,
    stockMinimo,
    estadoStock: calcularEstadoStockMock(stock, stockMinimo),
  });

  productos[idx] = actualizado;
  mockStorage.saveProductos(productos);
  return actualizado;
}

/**
 * DELETE /api/productos/{id} (ADMIN)
 */
export async function deleteProducto(id) {
  if (!USE_MOCKS) {
    await apiClient.delete(`/api/productos/${id}`);
    return { deleted: true };
  }

  await delay(220);
  const productos = mockStorage.getProductos();
  const filtrados = productos.filter((p) => Number(p.id) !== Number(id));
  mockStorage.saveProductos(filtrados);
  return { deleted: true };
}
