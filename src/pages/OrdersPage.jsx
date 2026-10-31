import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMisPedidos } from '../api/pedidos';
import { formatARS, formatDateAR } from '../utils/formatters';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';

const ESTADO_BADGE = {
  PENDIENTE_PAGO: 'bg-surface-container-high border-primary-container/60 text-primary',
  PAGADO: 'bg-primary-container/20 border-primary text-primary-fixed',
  EN_PREPARACION: 'bg-secondary-container/30 border-vermilion/50 text-secondary',
  PENDIENTE: 'bg-surface-container-high border-primary-container/60 text-primary',
  CONFIRMADO: 'bg-primary-container/20 border-primary text-primary-fixed',
  ENVIADO: 'bg-pine/30 border-pine text-tertiary',
  ENTREGADO: 'bg-pine/50 border-tertiary text-on-tertiary-container',
  CANCELADO: 'bg-error-container/60 border-error/60 text-error',
};

const ESTADO_LABEL = {
  PENDIENTE_PAGO: 'Pendiente de Pago',
  PAGADO: 'Pagado',
  EN_PREPARACION: 'En Preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
};

export default function OrdersPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMisPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No se pudo obtener tu historial de pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
      <div className="mb-space-lg pb-space-md border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm uppercase tracking-widest mb-2">
            <Link to="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-primary">Mis Pedidos</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright">
            Historial de Pedidos
          </h1>
          <p className="font-body-md text-body-md text-outline mt-1">
            Seguí el estado de tus órdenes y revisá el detalle de cada compra realizada.
          </p>
        </div>

        <Link
          to="/catalogo"
          className="px-4 py-2.5 rounded bg-surface-container-low hover:bg-surface-container-high border border-primary-container/40 text-primary font-label-md uppercase tracking-wider self-start sm:self-auto"
        >
          Nueva Compra
        </Link>
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={loadOrders} />
      ) : loading ? (
        <div className="flex flex-col gap-space-md animate-pulse">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-44 rounded bg-surface-container-low border border-outline-variant/50"
            />
          ))}
        </div>
      ) : pedidos.length === 0 ? (
        <EmptyState
          kanji="歴"
          icon="receipt_long"
          title="Todavía no registrás pedidos"
          description="Cuando confirmes tu primera compra en Yokai Hardware, aparecerá listada en esta sección junto con su código de seguimiento."
          actionLabel="Explorar Catálogo"
          actionTo="/catalogo"
        />
      ) : (
        <div className="flex flex-col gap-space-md">
          {pedidos.map((pedido) => {
            const badgeStyle =
              ESTADO_BADGE[pedido.estado] || ESTADO_BADGE.PENDIENTE;
            return (
              <div
                key={pedido.id}
                className="rounded bg-surface-container-low border border-outline-variant/60 overflow-hidden shadow-lg"
              >
                {/* Cabecera del Pedido */}
                <div className="px-space-lg py-space-md bg-surface-container-lowest border-b border-outline-variant/40 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-space-lg">
                    <div>
                      <span className="font-label-sm text-label-sm text-outline uppercase block">
                        Orden
                      </span>
                      <span className="font-headline-sm text-[17px] text-primary font-bold">
                        #{pedido.id}
                      </span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline uppercase block">
                        Fecha
                      </span>
                      <span className="font-body-sm text-on-surface-bright">
                        {formatDateAR(pedido.fecha)}
                      </span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-outline uppercase block">
                        Total
                      </span>
                      <span className="font-headline-sm text-[17px] text-on-surface-bright font-bold">
                        {formatARS(pedido.total)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded border font-label-sm text-label-sm uppercase tracking-wider ${badgeStyle}`}
                  >
                    {ESTADO_LABEL[pedido.estado] || pedido.estado}
                  </span>
                </div>

                {/* Cuerpo del Pedido */}
                <div className="p-space-lg flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-body-sm text-outline pb-space-sm border-b border-outline-variant/30">
                    <div>
                      <strong className="text-on-surface-variant">
                        Dirección de entrega:
                      </strong>{' '}
                      {pedido.direccionEnvio}
                    </div>
                    {pedido.metodoPago && (
                      <div>
                        <strong className="text-on-surface-variant">Pago:</strong>{' '}
                        {pedido.metodoPago}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(pedido.detalles || []).map((det, idx) => (
                      <div
                        key={`${pedido.id}-${det.productoId || idx}`}
                        className="flex items-center justify-between gap-3 p-3 rounded bg-surface-container border border-outline-variant/40"
                      >
                        <div className="flex items-center gap-3">
                          {det.imagen && (
                            <img
                              src={det.imagen}
                              alt={det.nombre}
                              className="w-12 h-12 object-contain rounded bg-surface-container-lowest p-1 shrink-0"
                            />
                          )}
                          <div>
                            <Link
                              to={`/producto/${det.productoId}`}
                              className="font-body-sm text-on-surface-bright hover:text-primary font-semibold line-clamp-1"
                            >
                              {det.nombre}
                            </Link>
                            <span className="font-label-sm text-outline block">
                              {det.cantidad} u. × {formatARS(det.precioUnitario)}
                            </span>
                          </div>
                        </div>
                        <span className="font-label-lg text-on-surface-bright font-bold shrink-0">
                          {formatARS(
                            Number(det.cantidad) * Number(det.precioUnitario)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
