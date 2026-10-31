import React from 'react';
import { Link } from 'react-router-dom';
import { formatARS } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  isConflicting = false,
  disabled = false,
}) {
  const { showToast } = useToast();
  const { producto, cantidad, subtotal } = item;
  const maxStock = Number(producto.stock ?? 0);
  const exceedsStock = cantidad > maxStock || maxStock <= 0;
  const hasStockConflict = Boolean(isConflicting || exceedsStock);
  const lineSubtotal =
    subtotal !== undefined
      ? Number(subtotal)
      : Number(producto.precio || 0) * Number(cantidad || 0);

  const handleDecrement = () => {
    if (cantidad <= 1) {
      onRemove(producto.id);
      showToast(`"${producto.nombre}" fue quitado del carrito.`, 'warning');
      return;
    }
    const targetQty = maxStock > 0 && cantidad > maxStock ? maxStock : cantidad - 1;
    onUpdateQuantity(producto.id, targetQty);
  };

  const handleIncrement = () => {
    if (cantidad >= maxStock) {
      showToast(
        `Stock máximo alcanzado (${maxStock} u.) para "${producto.nombre}".`,
        'warning'
      );
      return;
    }
    const res = onUpdateQuantity(producto.id, cantidad + 1);
    if (res && !res.ok && res.message) {
      showToast(res.message, 'warning');
    }
  };

  return (
    <div
      className={`p-space-md rounded border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md shadow-md transition-colors ${
        hasStockConflict
          ? 'bg-secondary-container/20 border-vermilion'
          : 'bg-surface-container-low border-outline-variant/60'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-space-md w-full sm:w-auto">
        <Link
          to={`/producto/${producto.id}`}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-surface-container-lowest border border-outline-variant/40 p-2 shrink-0 flex items-center justify-center"
        >
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-contain"
          />
        </Link>

        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
              {producto.categoria}
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-label-sm text-label-sm text-outline uppercase">
              {producto.marca}
            </span>
          </div>
          <Link
            to={`/producto/${producto.id}`}
            className="font-headline-sm text-[16px] text-on-surface-bright hover:text-primary font-semibold transition-colors line-clamp-2 break-words"
          >
            {producto.nombre}
          </Link>
          <span className="font-body-sm text-body-sm text-outline">
            Unitario: {formatARS(producto.precio)} • {producto.estadoStock || 'En stock'} ({maxStock} u.)
          </span>
          {hasStockConflict && (
            <span className="mt-1 inline-flex items-center gap-1.5 font-label-sm text-label-sm text-secondary font-semibold">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span>
                {maxStock <= 0
                  ? 'Sin stock disponible actualmente. Quitalo del carrito para continuar.'
                  : cantidad > maxStock
                  ? `Stock insuficiente: solicitaste ${cantidad} u. y quedan ${maxStock} u. disponibles.`
                  : 'Este producto no contaba con stock suficiente al confirmar el pedido.'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Controles de cantidad y subtotal del servidor */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-space-lg w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded px-2 py-1">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled}
            className="disabled:opacity-50 disabled:cursor-not-allowed w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-bright flex items-center justify-center transition-colors"
            aria-label="Restar unidad"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <span className="w-8 text-center font-label-lg text-label-lg text-on-surface-bright">
            {cantidad}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled}
            className="disabled:opacity-50 disabled:cursor-not-allowed w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-bright flex items-center justify-center transition-colors"
            aria-label="Sumar unidad"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        </div>

        <div className="text-right min-w-[100px] sm:min-w-[120px]">
          <span className="font-label-sm text-label-sm text-outline block uppercase">
            Subtotal
          </span>
          <span className="font-headline-sm text-[17px] text-on-surface-bright font-bold">
            {formatARS(lineSubtotal)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            onRemove(producto.id);
            showToast(`"${producto.nombre}" eliminado del carrito.`, 'warning');
          }}
          title="Quitar ítem"
          aria-label={`Quitar ${producto.nombre} del carrito`}
          disabled={disabled}
          className="disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 min-w-[40px] min-h-[40px] rounded bg-surface-container-high hover:bg-secondary-container/50 border border-outline-variant/50 hover:border-vermilion text-outline hover:text-secondary flex items-center justify-center transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}
