import apiClient, { ApiError, USE_MOCKS, USER_STORAGE_KEY } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';
import { getAllPedidosAdmin, updateEstadoPedido } from './admin';

function getCurrentMockUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/pedidos
 * Envía CheckoutRequestDto: { direccionEnvio, metodoPago }
 * Devuelve PedidoResponseDto: { id, fecha, estado, total, direccionEnvio, metodoPago, detalles[] }
 */
export async function crearPedido({ direccionEnvio, metodoPago, items = [] }) {
  if (!USE_MOCKS) {
    const payload = {
      direccionEnvio,
      metodoPago,
    };
    const { data } = await apiClient.post('/api/pedidos', payload);
    return data;
  }

  await delay(400);
  const user = getCurrentMockUser();
  if (!user) {
    throw new ApiError({
      message: 'Debés iniciar sesión para confirmar un pedido.',
      status: 401,
    });
  }

  const productos = mockStorage.getProductos();

  // Validar y descontar stock
  let totalCalculado = 0;
  for (const item of items) {
    const prodIdx = productos.findIndex((p) => Number(p.id) === Number(item.producto.id));
    if (prodIdx === -1) {
      throw new ApiError({
        message: `El producto "${item.producto.nombre}" ya no existe.`,
        status: 404,
      });
    }
    if (productos[prodIdx].stock < item.cantidad) {
      throw new ApiError({
        message: `Stock insuficiente para "${productos[prodIdx].nombre}". Disponible: ${productos[prodIdx].stock} u.`,
        status: 409,
      });
    }
    productos[prodIdx].stock -= item.cantidad;
    totalCalculado += Number(productos[prodIdx].precio) * Number(item.cantidad);
  }
  mockStorage.saveProductos(productos);

  const pedidos = mockStorage.getPedidos();
  const nuevoId =
    pedidos.reduce((max, p) => Math.max(max, Number(p.id) || 1000), 1000) + 1;

  const nuevoPedido = {
    id: nuevoId,
    usuarioId: user.id,
    usuarioNombre: user.nombre,
    usuarioEmail: user.email,
    fecha: new Date().toISOString(),
    estado: 'PENDIENTE_PAGO',
    total: totalCalculado,
    metodoPago: metodoPago || 'Transferencia Bancaria',
    direccionEnvio,
    detalles: items.map((i) => ({
      productoId: i.producto.id,
      nombre: i.producto.nombre,
      imagen: i.producto.imagen,
      cantidad: i.cantidad,
      precioUnitario: i.producto.precio,
    })),
  };

  pedidos.unshift(nuevoPedido);
  mockStorage.savePedidos(pedidos);
  mockStorage.saveServerCart(user.id, []);

  return nuevoPedido;
}

/**
 * GET /api/pedidos/mis-pedidos
 */
export async function getMisPedidos() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/pedidos/mis-pedidos');
    return data;
  }

  await delay(220);
  const user = getCurrentMockUser();
  if (!user) return [];
  const pedidos = mockStorage.getPedidos();
  return pedidos.filter(
    (p) =>
      Number(p.usuarioId) === Number(user.id) ||
      String(p.usuarioEmail).toLowerCase() === String(user.email).toLowerCase()
  );
}

export { getAllPedidosAdmin, updateEstadoPedido };
