import apiClient, { ApiError, USE_MOCKS } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';
import { createProducto, updateProducto, deleteProducto } from './productos';
import { createCategoria, updateCategoria, deleteCategoria } from './categorias';
import { createMarca, updateMarca, deleteMarca } from './marcas';

function calcularEstadoStockMock(stock, stockMinimo = 3) {
  const existencias = Number(stock ?? 0);
  const minimo = Number(stockMinimo ?? 3);
  if (existencias <= 0) return 'Sin stock';
  if (existencias <= minimo) return 'Últimas unidades';
  return 'En stock';
}

function enrichMockProductoAdmin(p) {
  const stock = Math.max(0, Number(p.stock ?? 0));
  const stockMinimo = Math.max(0, Number(p.stockMinimo ?? 3));
  return {
    ...p,
    stock,
    stockMinimo,
    estadoStock: p.estadoStock || calcularEstadoStockMock(stock, stockMinimo),
  };
}

/**
 * GET /api/admin/productos/stock-bajo (ADMIN)
 * Lista los productos cuyo stock actual es menor o igual a su stockMinimo.
 */
export async function getProductosStockBajoAdmin() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/admin/productos/stock-bajo');
    return data;
  }

  await delay(160);
  return mockStorage
    .getProductos()
    .map(enrichMockProductoAdmin)
    .filter((p) => p.stock <= p.stockMinimo);
}

/**
 * GET /api/admin/pedidos (ADMIN)
 * Devuelve todos los pedidos del sistema para gestión administrativa.
 */
export async function getAllPedidosAdmin() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/admin/pedidos');
    return data;
  }

  await delay(220);
  return mockStorage.getPedidos();
}

/**
 * PATCH /api/admin/pedidos/{id}/estado (ADMIN)
 * Actualiza el estado de un pedido validando las transiciones permitidas.
 */
export async function updateEstadoPedido(id, estado) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.patch(`/api/admin/pedidos/${id}/estado`, {
      estado,
    });
    return data;
  }

  await delay(200);
  const pedidos = mockStorage.getPedidos();
  const idx = pedidos.findIndex((p) => Number(p.id) === Number(id));
  if (idx === -1) {
    throw new ApiError({
      message: 'Pedido no encontrado.',
      status: 404,
    });
  }
  pedidos[idx].estado = estado;
  mockStorage.savePedidos(pedidos);
  return pedidos[idx];
}

export {
  createProducto,
  updateProducto,
  deleteProducto,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  createMarca,
  updateMarca,
  deleteMarca,
};
