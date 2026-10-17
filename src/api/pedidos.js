import apiClient, { USE_MOCKS, USER_STORAGE_KEY } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';

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
 * Modelo Pedido: { id, fecha, estado, total, direccionEnvio, detalles[] }
 */
export async function crearPedido({ direccionEnvio, metodoPago, items, total }) {
  if (!USE_MOCKS) {
    const payload = {
      direccionEnvio,
      metodoPago,
      detalles: items.map((i) => ({
        productoId: i.producto.id,
        cantidad: i.cantidad,
        precioUnitario: i.producto.precio,
      })),
    };
    const { data } = await apiClient.post('/api/pedidos', payload);
    return data;
  }

  await delay(400);
  const user = getCurrentMockUser();
  if (!user) {
    const err = new Error('Debés iniciar sesión para confirmar un pedido.');
    err.status = 401;
    throw err;
  }

  const productos = mockStorage.getProductos();

  // Validar y descontar stock
  for (const item of items) {
    const prodIdx = productos.findIndex((p) => Number(p.id) === Number(item.producto.id));
    if (prodIdx === -1) {
      throw new Error(`El producto "${item.producto.nombre}" ya no existe.`);
    }
    if (productos[prodIdx].stock < item.cantidad) {
      throw new Error(
        `Stock insuficiente para "${productos[prodIdx].nombre}". Disponible: ${productos[prodIdx].stock} u.`
      );
    }
    productos[prodIdx].stock -= item.cantidad;
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
    estado: 'PENDIENTE',
    total: Number(total),
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

/**
 * GET /api/pedidos (ADMIN)
 */
export async function getAllPedidosAdmin() {
  if (!USE_MOCKS) {
    const { data } = await apiClient.get('/api/pedidos');
    return data;
  }

  await delay(220);
  return mockStorage.getPedidos();
}

/**
 * PUT /api/pedidos/{id}/estado (ADMIN)
 */
export async function updateEstadoPedido(id, estado) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.put(`/api/pedidos/${id}/estado`, { estado });
    return data;
  }

  await delay(200);
  const pedidos = mockStorage.getPedidos();
  const idx = pedidos.findIndex((p) => Number(p.id) === Number(id));
  if (idx === -1) throw new Error('Pedido no encontrado.');
  pedidos[idx].estado = estado;
  mockStorage.savePedidos(pedidos);
  return pedidos[idx];
}
