import React from 'react';
import { Link } from 'react-router-dom';
import { formatARS } from '../../utils/formatters';

export default function OrderSummary({
  totalItems,
  subtotal,
  ctaLabel = 'Continuar al Checkout',
  ctaTo = '/checkout',
  onSubmitOrder = null,
  submitting = false,
}) {
  return (
    <div className="p-space-lg rounded bg-surface-container-low border border-primary-container/40 flex flex-col gap-space-md shadow-xl sticky top-24">
      <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/40">
        <h3 className="font-headline-sm text-headline-sm text-on-surface-bright">
          Resumen del Pedido
        </h3>
        <span className="px-2.5 py-0.5 rounded bg-surface-container-high border border-primary-container/40 text-primary font-label-sm">
          {totalItems} {totalItems === 1 ? 'unidad' : 'unidades'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 font-body-sm text-body-sm">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Subtotal de componentes</span>
          <span className="font-semibold text-on-surface-bright">
            {formatARS(subtotal)}
          </span>
        </div>
      </div>

      <div className="pt-space-sm border-t border-outline-variant/40 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="font-label-lg text-label-lg text-on-surface-bright uppercase">
            Total del Pedido
          </span>
          <span className="font-headline-md text-headline-md text-primary font-bold">
            {formatARS(subtotal)}
          </span>
        </div>
      </div>

      {onSubmitOrder ? (
        <button
          type="submit"
          disabled={submitting || totalItems === 0}
          onClick={onSubmitOrder}
          className="w-full py-3.5 px-6 rounded bg-vermilion hover:bg-vermilion-dark disabled:opacity-50 text-white font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-secondary/30 shadow-vermilion-glow"
        >
          <span>{submitting ? 'Procesando pedido...' : ctaLabel}</span>
          <span className="material-symbols-outlined text-[18px]">
            verified
          </span>
        </button>
      ) : (
        <Link
          to={ctaTo}
          className="w-full py-3.5 px-6 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-secondary/30 shadow-vermilion-glow"
        >
          <span>{ctaLabel}</span>
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </Link>
      )}

      <div className="flex items-center justify-center gap-2 text-outline font-label-sm text-label-sm pt-1">
        <span className="material-symbols-outlined text-[16px] text-primary">
          lock
        </span>
        <span>Transacción protegida con encriptación JWT</span>
      </div>
    </div>
  );
}
