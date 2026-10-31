import apiClient from './client';
import { getAllPedidosAdmin, updateEstadoPedido } from './admin';

/**
 * POST /api/pedidos
 * Envía CheckoutRequestDto: { direccionEnvio, metodoPago }
 * Devuelve PedidoResponseDto: { id, fecha, estado, total, direccionEnvio, metodoPago, detalles[] }
 */
export async function crearPedido({ direccionEnvio, metodoPago }) {
  const { data } = await apiClient.post('/api/pedidos', { direccionEnvio, metodoPago });
  return data;
}

/**
 * GET /api/pedidos/mis-pedidos
 */
export async function getMisPedidos() {
  const { data } = await apiClient.get('/api/pedidos/mis-pedidos');
  return data;
}

export { getAllPedidosAdmin, updateEstadoPedido };
