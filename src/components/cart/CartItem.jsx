import React from 'react';
import { Link } from 'react-router-dom';
import { formatARS } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const { showToast } = useToast();
  const { producto, cantidad, subtotal } = item;
  const maxStock = Number(producto.stock ?? 0);
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
    onUpdateQuantity(producto.id, cantidad - 1);
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
    <div className="p-space-md rounded bg-surface-container-low border border-outline-variant/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md shadow-md">
      <div className="flex items-center gap-space-md w-full sm:w-auto">
        <Link
          to={`/producto/${producto.id}`}
          className="w-20 h-20 rounded bg-surface-container-lowest border border-outline-variant/40 p-2 shrink-0 flex items-center justify-center"
        >
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-contain"
          />
        </Link>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
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
            className="font-headline-sm text-[16px] text-on-surface-bright hover:text-primary font-semibold transition-colors line-clamp-2"
          >
            {producto.nombre}
          </Link>
          <span className="font-body-sm text-body-sm text-outline">
            Unitario: {formatARS(producto.precio)} • {producto.estadoStock || 'En stock'} ({maxStock} u.)
          </span>
        </div>
      </div>

      {/* Controles de cantidad y subtotal del servidor */}
      <div className="flex items-center justify-between sm:justify-end gap-space-lg w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/40">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/60 rounded px-2 py-1">
          <button
            type="button"
            onClick={handleDecrement}
            className="w-7 h-7 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-bright flex items-center justify-center transition-colors"
            aria-label="Restar unidad"
          >
            <span className="material-symbols-outlined text-[15px]">remove</span>
          </button>
          <span className="w-7 text-center font-label-lg text-label-lg text-on-surface-bright">
            {cantidad}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            className="w-7 h-7 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface-bright flex items-center justify-center transition-colors"
            aria-label="Sumar unidad"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
          </button>
        </div>

        <div className="text-right min-w-[120px]">
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
          className="w-9 h-9 rounded bg-surface-container-high hover:bg-secondary-container/50 border border-outline-variant/50 hover:border-vermilion text-outline hover:text-secondary flex items-center justify-center transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}
