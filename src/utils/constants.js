export const STORE_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuALeJSJqOD9dRS-y5WXIN_YrNQ2uU_YimboJhZIh4t0f1OVfvtrhndSqIIoJ9FcvTxZBHoxnvhC3SzU1trAPOPxLD0C5puNeZPeucY7zdebeR61aTnEuu9m1QkfyBb_PW6efAH3HCiOpigpd86hjB6w1sh2T73XnqOtZrymmDl8lBuJwnL9jFTmBdxvRYsRQg0qYPLlOOhXUiq3oRJs_KpPIcMvrSMsi7oOLCyADLGfOqyqdjUSFGSTHQ';
export const DEFAULT_HERO_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBc0XruKgt0lbQyzWbT7AjSy9YdUM6QbHpSedy4H400JKbCf7Lk2mhoR-idXS4B27n1HKJXzZf96pgmM9AlgJB12PSi2iJf23jMtx8pqxWp8SK-VaC-jsukRKuZfBIh4bzQ_iAcJUfCr4d7DO0F65Sy_GPtCdZgoQoAuZKySzznfuq0i43Kb5TkgGKSixuXICsK1slWAQTZAShNzCY7S4Fc45vjrTE0nuVJli5p8xmJOppQcOyh757J9w';

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

export const ESTADO_PEDIDO_BADGE = {
  PENDIENTE_PAGO: 'bg-surface-container-high border-primary-container/60 text-primary',
  PAGADO: 'bg-primary-container/20 border-primary text-primary-fixed',
  EN_PREPARACION: 'bg-secondary-container/30 border-vermilion/50 text-secondary',
  ENVIADO: 'bg-pine/30 border-pine text-tertiary',
  ENTREGADO: 'bg-pine/50 border-tertiary text-on-tertiary-container',
  CANCELADO: 'bg-error-container/60 border-error/60 text-error',
  PENDIENTE: 'bg-surface-container-high border-primary-container/60 text-primary',
  CONFIRMADO: 'bg-primary-container/20 border-primary text-primary-fixed',
};

