import apiClient from './client';
import { createProducto, updateProducto, deleteProducto } from './productos';
import { createCategoria, updateCategoria, deleteCategoria } from './categorias';
import { createMarca, updateMarca, deleteMarca } from './marcas';

/**
 * GET /api/admin/productos/stock-bajo (ADMIN)
 * Lista los productos cuyo stock actual es menor o igual a su stockMinimo.
 */
export async function getProductosStockBajoAdmin() {
  const { data } = await apiClient.get('/api/admin/productos/stock-bajo');
  return data;
}

/**
 * GET /api/admin/pedidos (ADMIN)
 * Devuelve todos los pedidos del sistema para gestión administrativa.
 */
export async function getAllPedidosAdmin() {
  const { data } = await apiClient.get('/api/admin/pedidos');
  return data;
}

/**
 * PATCH /api/admin/pedidos/{id}/estado (ADMIN)
 * Actualiza el estado de un pedido validando las transiciones permitidas.
 */
export async function updateEstadoPedido(id, estado) {
  const { data } = await apiClient.patch(`/api/admin/pedidos/${id}/estado`, {
    estado,
  });
  return data;
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
