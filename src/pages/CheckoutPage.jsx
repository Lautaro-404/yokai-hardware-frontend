import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { crearPedido } from '../api/pedidos';
import { formatARS, formatDateAR } from '../utils/formatters';
import { ESTADO_PEDIDO_LABEL } from '../utils/constants';
import EmptyState from '../components/ui/EmptyState';

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

export default function CheckoutPage() {
  const { items, totalItems, subtotal, clearCart } = useCart();
  const { usuario } = useAuth();
  const { showToast } = useToast();

  const [shipping, setShipping] = useState({
    destinatario: usuario?.nombre || '',
    calle: usuario?.direccion || '',
    pisoDepto: '',
    localidad: 'San Rafael',
    provincia: 'Mendoza',
    codigoPostal: '5600',
    telefono: '',
    metodoPago: 'transferencia',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!shipping.destinatario.trim()) {
      errs.destinatario = 'Ingresá el nombre de quien recibe el pedido.';
    }
    if (!shipping.calle.trim() || shipping.calle.trim().length < 5) {
      errs.calle = 'Ingresá calle y numeración válidas.';
    }
    if (!shipping.localidad.trim()) {
      errs.localidad = 'Ingresá tu localidad o ciudad.';
    }
    if (!shipping.codigoPostal.trim() || shipping.codigoPostal.trim().length < 4) {
      errs.codigoPostal = 'Ingresá un código postal válido (ej. 5600).';
    }
    if (!shipping.telefono.trim() || shipping.telefono.trim().length < 7) {
      errs.telefono = 'Ingresá un teléfono de contacto para el correo.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const direccionCompleta = `${shipping.calle.trim()}${
      shipping.pisoDepto.trim() ? ` (${shipping.pisoDepto.trim()})` : ''
    }, ${shipping.localidad.trim()}, ${shipping.provincia} (CP ${shipping.codigoPostal.trim()}) - Tel: ${shipping.telefono.trim()}`;

    const metodoLabel =
      shipping.metodoPago === 'transferencia'
        ? 'Transferencia Bancaria'
        : 'Tarjeta de Crédito';

    setSubmitting(true);
    try {
      const pedidoCreado = await crearPedido({
        direccionEnvio: direccionCompleta,
        metodoPago: metodoLabel,
        items,
        total: subtotal,
      });
      setConfirmedOrder(pedidoCreado);
      clearCart();
      showToast(`¡Pedido #${pedidoCreado.id} confirmado con éxito!`, 'success');
    } catch (err) {
      setSubmitError(
        err?.message || 'No se pudo registrar el pedido. Intentá nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Pantalla de Confirmación de Compra
  if (confirmedOrder) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <div className="max-w-2xl mx-auto p-space-xl rounded bg-surface-container-low border border-primary-container/60 shadow-2xl relative overflow-hidden">
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
          <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright mt-1">
            ¡Gracias por tu compra, {usuario?.nombre}!
          </h1>
          <p className="font-body-md text-body-md text-outline mt-2">
            Tu pedido fue registrado y el stock ya fue descontado en una transacción atómica.
          </p>

          <div className="my-space-lg p-space-md rounded bg-surface-container-lowest border border-outline-variant/60 flex flex-col gap-2.5 font-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-outline">Número de Pedido:</span>
              <span className="font-label-lg text-primary font-bold">
                #{confirmedOrder.id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline">Fecha y Hora:</span>
              <span className="text-on-surface-bright">
                {formatDateAR(confirmedOrder.fecha)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline">Estado Inicial:</span>
              <span className="px-2.5 py-0.5 rounded bg-surface-container-high border border-primary-container/50 text-primary font-label-sm uppercase">
                {ESTADO_PEDIDO_LABEL[confirmedOrder.estado] || confirmedOrder.estado}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-outline-variant/40">
              <span className="text-outline">Dirección de Envío:</span>
              <span className="text-on-surface-bright sm:text-right">
                {confirmedOrder.direccionEnvio}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40">
              <span className="font-label-lg text-on-surface-bright uppercase">
                Total Confirmado:
              </span>
              <span className="font-headline-md text-secondary font-bold">
                {formatARS(confirmedOrder.total)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-md relative z-10">
            <Link
              to="/pedidos"
              className="px-6 py-3.5 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-lg text-label-lg uppercase tracking-wider flex items-center gap-2 border border-secondary/30 shadow-vermilion-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                receipt_long
              </span>
              <span>Ver Mis Pedidos</span>
            </Link>
            <Link
              to="/catalogo"
              className="px-6 py-3.5 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary border border-primary-container/40 font-label-lg text-label-lg uppercase tracking-wider transition-colors"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
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
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
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
        <div className="mb-space-md p-4 rounded bg-secondary-container/30 border border-vermilion text-secondary font-body-sm flex items-center gap-2">
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
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <div className="p-space-lg rounded bg-surface-container-low border border-outline-variant/60 flex flex-col gap-space-md shadow-lg">
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
          <div className="p-space-lg rounded bg-surface-container-low border border-outline-variant/60 flex flex-col gap-space-md shadow-lg">
            <h2 className="font-headline-sm text-headline-sm text-on-surface-bright flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                payments
              </span>
              <span>2. Medio de Pago</span>
            </h2>

            <div className="grid grid-cols-1 gap-3">
              <label
                className={`p-4 rounded border cursor-pointer flex items-center justify-between transition-all ${
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
                    className="accent-primary"
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
                <span className="font-headline-sm text-[17px] text-primary font-bold">
                  {formatARS(subtotal)}
                </span>
              </label>

              <label
                className={`p-4 rounded border cursor-pointer flex items-center justify-between transition-all ${
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
                    className="accent-primary"
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
                <span className="font-headline-sm text-[17px] text-on-surface-bright font-bold">
                  {formatARS(subtotal)}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalle de Ítems y Confirmación */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="p-space-lg rounded bg-surface-container-low border border-primary-container/40 flex flex-col gap-space-md shadow-xl">
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
                    <div className="flex items-center gap-3">
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="w-12 h-12 object-contain rounded bg-surface-container p-1 shrink-0"
                      />
                      <div>
                        <p className="font-body-sm text-body-sm text-on-surface-bright font-medium line-clamp-1">
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
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded bg-vermilion hover:bg-vermilion-dark disabled:opacity-50 text-white font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-secondary/30 shadow-vermilion-glow"
            >
              <span className="material-symbols-outlined text-[20px]">
                verified
              </span>
              <span>
                {submitting ? 'Confirmando Pedido...' : 'Confirmar y Crear Pedido'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
