import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { crearPedido } from '../api/pedidos';
import { formatARS, formatDateAR } from '../utils/formatters';
import { ESTADO_PEDIDO_LABEL, ESTADO_PEDIDO_BADGE } from '../utils/constants';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';

const CHECKOUT_DRAFT_KEY_PREFIX = 'yokai_checkout_shipping_draft_v1';

const PROVINCIAS_AR = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

function extractConflictingProductName(message = '') {
  if (typeof message !== 'string') return '';
  const quotedMatch = message.match(/["«“]([^"»”]+)["»”]/);
  return quotedMatch && quotedMatch[1] ? quotedMatch[1].trim() : '';
}

function getDraftStorageKey(userId) {
  return userId
    ? `${CHECKOUT_DRAFT_KEY_PREFIX}_${userId}`
    : CHECKOUT_DRAFT_KEY_PREFIX;
}

function loadShippingDraft(usuario) {
  const defaults = {
    destinatario: usuario?.nombre || '',
    calle: usuario?.direccion || '',
    pisoDepto: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    telefono: '',
    metodoPago: 'transferencia',
  };

  try {
    const raw =
      sessionStorage.getItem(getDraftStorageKey(usuario?.id)) ||
      sessionStorage.getItem(CHECKOUT_DRAFT_KEY_PREFIX);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      destinatario: parsed.destinatario || defaults.destinatario,
      calle: parsed.calle || defaults.calle,
    };
  } catch {
    return defaults;
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    items,
    syncingCart,
    cartBusy,
    cartError,
    fetchCart,
    reportStockConflict,
    clearStockConflict,
    totalItems,
    subtotal,
    clearLocalCart,
  } = useCart();
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [shipping, setShipping] = useState(() => loadShippingDraft(usuario));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const submittingRef = useRef(false);

  // Persistir borrador de datos de envío en sessionStorage para no perder lo completado si vuelve al carrito
  useEffect(() => {
    if (confirmedOrder) return;
    try {
      const serialized = JSON.stringify(shipping);
      sessionStorage.setItem(getDraftStorageKey(usuario?.id), serialized);
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY_PREFIX, serialized);
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [shipping, usuario?.id, confirmedOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    const destinatario = shipping.destinatario.trim();
    const calle = shipping.calle.trim();
    const localidad = shipping.localidad.trim();
    const codigoPostal = shipping.codigoPostal.trim();
    const telefono = shipping.telefono.trim();

    if (!destinatario || destinatario.length < 3) {
      errs.destinatario = 'Ingresá el nombre y apellido de quien recibe el pedido.';
    }
    if (!calle || calle.length < 5) {
      errs.calle = 'Ingresá calle y numeración válidas (mínimo 5 caracteres).';
    }
    if (!localidad || localidad.length < 2) {
      errs.localidad = 'Ingresá tu localidad o ciudad.';
    }
    if (!shipping.provincia) {
      errs.provincia = 'Seleccioná una provincia.';
    }
    if (!codigoPostal || !/^[A-Za-z0-9]{4,8}$/.test(codigoPostal)) {
      errs.codigoPostal = 'Ingresá un código postal válido (ej. 5600 o M5600).';
    }
    if (!telefono || telefono.replace(/\D/g, '').length < 7) {
      errs.telefono = 'Ingresá un teléfono de contacto válido (al menos 7 dígitos).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (submittingRef.current || submitting || cartBusy) return;

    setSubmitError('');
    if (!validate()) return;

    const direccionCompleta = `${shipping.calle.trim()}${
      shipping.pisoDepto.trim() ? ` (${shipping.pisoDepto.trim()})` : ''
    }, ${shipping.localidad.trim()}, ${shipping.provincia} (CP ${shipping.codigoPostal.trim()}) - Recibe: ${shipping.destinatario.trim()} - Tel: ${shipping.telefono.trim()}`;

    const metodoLabel =
      shipping.metodoPago === 'transferencia'
        ? 'Transferencia Bancaria'
        : 'Tarjeta de Crédito';

    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Asegurar que cualquier ítem local haya sido sincronizado con /api/carrito antes del checkout
      if (items.some((entry) => !entry.id)) {
        await fetchCart();
      }

      const pedidoCreado = await crearPedido({
        direccionEnvio: direccionCompleta,
        metodoPago: metodoLabel,
        items,
        total: subtotal,
      });

      setConfirmedOrder(pedidoCreado);
      clearLocalCart();
      clearStockConflict();
      try {
        sessionStorage.removeItem(getDraftStorageKey(usuario?.id));
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY_PREFIX);
      } catch {
        // Ignorar errores de almacenamiento
      }
      showToast(`¡Pedido #${pedidoCreado.id} confirmado con éxito!`, 'success');
    } catch (err) {
      // Si el backend responde 409 por stock, volvemos al carrito indicando qué producto falló sin perder los datos de envío
      if (err?.status === 409) {
        const productName = extractConflictingProductName(err?.message);
        const conflictMessage =
          err?.message ||
          'No hay stock suficiente para completar la compra de uno de los productos de tu carrito.';
        await fetchCart();
        const conflictPayload = {
          message: conflictMessage,
          productName,
        };
        reportStockConflict(conflictPayload);
        showToast(conflictMessage, 'error');
        navigate('/carrito', {
          state: {
            stockConflict: conflictPayload,
            fromCheckout: true,
          },
        });
        return;
      }

      if (err?.fieldErrors?.direccionEnvio) {
        setErrors((prev) => ({
          ...prev,
          calle: err.fieldErrors.direccionEnvio,
        }));
      }

      setSubmitError(
        err?.message || 'No se pudo registrar el pedido. Intentá nuevamente.'
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Pantalla de Confirmación de Compra
  if (confirmedOrder) {
    const estadoBadge =
      ESTADO_PEDIDO_BADGE[confirmedOrder.estado] ||
      ESTADO_PEDIDO_BADGE.PENDIENTE_PAGO;
    const detallesConfirmados = Array.isArray(confirmedOrder.detalles)
      ? confirmedOrder.detalles
      : [];

    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-gutter py-space-xl">
        <div className="max-w-3xl mx-auto p-4 sm:p-space-xl rounded bg-surface-container-low border border-primary-container/60 shadow-2xl relative overflow-hidden">
          <span className="pointer-events-none select-none absolute -right-4 -bottom-6 font-serif text-[160px] text-primary/10 leading-none">
            祝
          </span>
          <div className="w-16 h-16 rounded bg-pine/30 border border-pine flex items-center justify-center mb-space-md shadow-md">
            <span className="material-symbols-outlined text-tertiary text-[34px]">
              task_alt
            </span>
          </div>

          <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
            Orden Forjada en el Santuario
          </span>
          <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright mt-1 break-words">
            ¡Gracias por tu compra, {usuario?.nombre}!
          </h1>
          <p className="font-body-md text-body-md text-outline mt-2">
            Tu pedido fue registrado y el stock ya fue descontado en el catálogo.
          </p>

          <div className="my-space-lg p-3 sm:p-space-md rounded bg-surface-container-lowest border border-outline-variant/60 flex flex-col gap-3 font-body-sm relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-outline">Número de Pedido:</span>
              <span className="font-headline-sm text-[18px] text-primary font-bold">
                #{confirmedOrder.id}
              </span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-outline">Fecha y Hora:</span>
              <span className="text-on-surface-bright">
                {formatDateAR(confirmedOrder.fecha)}
              </span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-outline">Estado del Pedido:</span>
              <span
                className={`px-2.5 py-0.5 rounded border font-label-sm uppercase ${estadoBadge}`}
              >
                {ESTADO_PEDIDO_LABEL[confirmedOrder.estado] || confirmedOrder.estado}
              </span>
            </div>
            {confirmedOrder.metodoPago && (
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-outline">Medio de Pago:</span>
                <span className="text-on-surface-bright font-medium">
                  {confirmedOrder.metodoPago}
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-outline-variant/40">
              <span className="text-outline shrink-0">Dirección de Envío:</span>
              <span className="text-on-surface-bright sm:text-right break-words">
                {confirmedOrder.direccionEnvio}
              </span>
            </div>

            {detallesConfirmados.length > 0 && (
              <div className="pt-3 border-t border-outline-variant/40 flex flex-col gap-2.5">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Resumen de Productos ({detallesConfirmados.length})
                </span>
                <div className="flex flex-col gap-2">
                  {detallesConfirmados.map((det, idx) => (
                    <div
                      key={`${confirmedOrder.id}-${det.productoId || idx}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded bg-surface-container border border-outline-variant/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {det.imagen && (
                          <img
                            src={det.imagen}
                            alt={det.nombre}
                            className="w-11 h-11 object-contain rounded bg-surface-container-lowest p-1 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-body-sm text-on-surface-bright font-semibold block truncate">
                            {det.nombre}
                          </span>
                          <span className="font-label-sm text-outline">
                            {det.cantidad} u. × {formatARS(det.precioUnitario)}
                          </span>
                        </div>
                      </div>
                      <span className="font-label-lg text-on-surface-bright font-bold shrink-0">
                        {formatARS(
                          Number(det.cantidad || 0) * Number(det.precioUnitario || 0)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
              <span className="font-label-lg text-on-surface-bright uppercase">
                Total Confirmado:
              </span>
              <span className="font-headline-md text-secondary font-bold">
                {formatARS(confirmedOrder.total)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md relative z-10">
            <Link
              to="/pedidos"
              className="px-6 py-3.5 min-h-[48px] rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-2 border border-secondary/30 shadow-vermilion-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                receipt_long
              </span>
              <span>Ver Mis Pedidos</span>
            </Link>
            <Link
              to="/catalogo"
              className="px-6 py-3.5 min-h-[48px] rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary border border-primary-container/40 font-label-lg text-label-lg uppercase tracking-wider transition-colors flex items-center justify-center"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-gutter py-space-xl">
        <ErrorMessage message={cartError} onRetry={fetchCart} />
      </div>
    );
  }

  if (syncingCart && items.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-gutter py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl animate-pulse">
          <div className="lg:col-span-7 h-96 rounded bg-surface-container-low border border-outline-variant/50" />
          <div className="lg:col-span-5 h-72 rounded bg-surface-container-low border border-outline-variant/50" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-gutter py-space-xl">
        <EmptyState
          kanji="空"
          icon="shopping_cart_off"
          title="No hay productos para finalizar la compra"
          description="Agregá al menos un componente a tu carrito antes de continuar al checkout."
          actionLabel="Ir al Catálogo"
          actionTo="/catalogo"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-gutter py-space-xl">
      <div className="mb-space-lg pb-space-md border-b border-outline-variant/40">
        <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm uppercase tracking-widest mb-2">
          <Link to="/carrito" className="hover:text-primary transition-colors">
            Carrito
          </Link>
          <span>/</span>
          <span className="text-primary">Checkout y Envío</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright">
          Finalizar Pedido
        </h1>
        <p className="font-body-md text-body-md text-outline mt-1">
          Completá los datos de entrega para despachar tus componentes con seguro oficial.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-space-md p-4 rounded bg-secondary-container/30 border border-vermilion text-secondary font-body-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{submitError}</span>
        </div>
      )}

      <form
        onSubmit={handleConfirmOrder}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start"
      >
        {/* Columna Izquierda: Datos de Envío y Pago */}
        <div className="lg:col-span-7 min-w-0 flex flex-col gap-space-lg">
          <div className="p-4 sm:p-space-lg rounded bg-surface-container-low border border-outline-variant/60 flex flex-col gap-space-md shadow-lg">
            <h2 className="font-headline-sm text-headline-sm text-on-surface-bright flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                local_shipping
              </span>
              <span>1. Datos de Entrega en Argentina</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="sm:col-span-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Nombre y Apellido de quien recibe *
                </label>
                <input
                  type="text"
                  name="destinatario"
                  value={shipping.destinatario}
                  onChange={handleChange}
                  placeholder="Ej: Abril Gómez"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3.5 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                />
                {errors.destinatario && (
                  <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                    {errors.destinatario}
                  </span>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Calle y Número *
                </label>
                <input
                  type="text"
                  name="calle"
                  value={shipping.calle}
                  onChange={handleChange}
                  placeholder="Ej: Av. San Martín 850"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3.5 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                />
                {errors.calle && (
                  <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                    {errors.calle}
                  </span>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Piso / Depto / Referencia
                </label>
                <input
                  type="text"
                  name="pisoDepto"
                  value={shipping.pisoDepto}
                  onChange={handleChange}
                  placeholder="Ej: Piso 2 Depto B"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3.5 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Localidad / Ciudad *
                </label>
                <input
                  type="text"
                  name="localidad"
                  value={shipping.localidad}
                  onChange={handleChange}
                  placeholder="Ej: San Rafael"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3.5 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                />
                {errors.localidad && (
                  <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                    {errors.localidad}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Provincia *
                </label>
                <select
                  name="provincia"
                  value={shipping.provincia}
                  onChange={handleChange}
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3.5 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                >
                  <option value="">Seleccioná una provincia</option>
                  {PROVINCIAS_AR.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Código Postal *
                </label>
                <input
                  type="text"
                  name="codigoPostal"
                  value={shipping.codigoPostal}
                  onChange={handleChange}
                  placeholder="Ej: 5600"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3.5 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                />
                {errors.codigoPostal && (
                  <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                    {errors.codigoPostal}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={shipping.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 2604 556677"
                  className="w-full bg-surface-container-lowest text-on-surface text-body-sm px-3.5 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
                />
                {errors.telefono && (
                  <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                    {errors.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="p-4 sm:p-space-lg rounded bg-surface-container-low border border-outline-variant/60 flex flex-col gap-space-md shadow-lg">
            <h2 className="font-headline-sm text-headline-sm text-on-surface-bright flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                payments
              </span>
              <span>2. Medio de Pago</span>
            </h2>

            <div className="grid grid-cols-1 gap-3">
              <label
                className={`p-4 rounded border cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  shipping.metodoPago === 'transferencia'
                    ? 'bg-surface-container border-primary-container shadow-gold-glow'
                    : 'bg-surface-container-lowest border-outline-variant/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="transferencia"
                    checked={shipping.metodoPago === 'transferencia'}
                    onChange={handleChange}
                    className="accent-primary w-5 h-5"
                  />
                  <div>
                    <span className="font-headline-sm text-[16px] text-on-surface-bright block">
                      Transferencia o Depósito Bancario (CBU / Alias)
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">
                      Confirmación de pago mediante comprobante bancario
                    </span>
                  </div>
                </div>
                <span className="font-headline-sm text-[17px] text-primary font-bold self-end sm:self-auto">
                  {formatARS(subtotal)}
                </span>
              </label>

              <label
                className={`p-4 rounded border cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  shipping.metodoPago === 'tarjeta_6'
                    ? 'bg-surface-container border-primary-container shadow-gold-glow'
                    : 'bg-surface-container-lowest border-outline-variant/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="metodoPago"
                    value="tarjeta_6"
                    checked={shipping.metodoPago === 'tarjeta_6'}
                    onChange={handleChange}
                    className="accent-primary w-5 h-5"
                  />
                  <div>
                    <span className="font-headline-sm text-[16px] text-on-surface-bright block">
                      Tarjeta de Crédito Bancaria
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">
                      Acreditación a precio oficial de lista
                    </span>
                  </div>
                </div>
                <span className="font-headline-sm text-[17px] text-on-surface-bright font-bold self-end sm:self-auto">
                  {formatARS(subtotal)}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalle de Ítems y Confirmación */}
        <div className="lg:col-span-5 min-w-0 flex flex-col gap-space-md">
          <div className="p-4 sm:p-space-lg rounded bg-surface-container-low border border-primary-container/40 flex flex-col gap-space-md shadow-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface-bright pb-space-sm border-b border-outline-variant/40">
              Componentes en tu Pedido ({totalItems})
            </h3>

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => {
                const { producto, cantidad } = item;
                const lineSubtotal =
                  item.subtotal !== undefined
                    ? Number(item.subtotal)
                    : Number(producto.precio || 0) * Number(cantidad || 0);
                return (
                  <div
                    key={item.id || producto.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded bg-surface-container-lowest border border-outline-variant/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-12 h-12 object-contain rounded bg-surface-container p-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-body-sm text-body-sm text-on-surface-bright font-medium line-clamp-1 truncate">
                          {producto.nombre}
                        </p>
                        <span className="font-label-sm text-label-sm text-outline">
                          Cantidad: {cantidad} u. × {formatARS(producto.precio)}
                        </span>
                      </div>
                    </div>
                    <span className="font-label-lg text-on-surface-bright font-bold shrink-0">
                      {formatARS(lineSubtotal)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-space-sm border-t border-outline-variant/40 flex flex-col gap-2 font-body-sm">
              <div className="flex justify-between items-baseline pt-2">
                <span className="font-label-lg text-on-surface-bright uppercase">
                  Total a Pagar
                </span>
                <span className="font-headline-lg text-headline-lg-mobile text-primary font-bold">
                  {formatARS(subtotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cartBusy}
              aria-busy={submitting}
              className="w-full min-h-[48px] py-3.5 px-6 rounded bg-vermilion hover:bg-vermilion-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-secondary/30 shadow-vermilion-glow"
            >
              <span className="material-symbols-outlined text-[20px]">
                {submitting ? 'hourglass_top' : 'verified'}
              </span>
              <span>
                {submitting ? 'Confirmando pedido...' : 'Confirmar pedido'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
