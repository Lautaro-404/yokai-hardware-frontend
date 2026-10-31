import { YOKAI_LOGO_URL, HERO_ONI_GPU_URL } from '../mocks/productosMock';

export const STORE_LOGO_URL = YOKAI_LOGO_URL;
export const DEFAULT_HERO_IMAGE_URL = HERO_ONI_GPU_URL;

/**
 * Transiciones válidas de estado de pedido según la máquina de estados del backend (EstadoPedido.java)
 */
export const TRANSICIONES_ESTADO_PEDIDO = {
  PENDIENTE_PAGO: ['PAGADO', 'CANCELADO'],
  PAGADO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export const ESTADO_PEDIDO_LABEL = {
  PENDIENTE_PAGO: 'Pendiente de Pago',
  PAGADO: 'Pagado',
  EN_PREPARACION: 'En Preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
};
