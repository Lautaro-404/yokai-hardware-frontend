import React from 'react';
import { Link } from 'react-router-dom';
import { formatARS } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function ProductCard({ producto }) {
  const { addToCart, cartBusy } = useCart();
  const { showToast } = useToast();

  const stock = Number(producto.stock ?? 0);
  const estadoStock =
    producto.estadoStock ||
    (stock <= 0 ? 'Sin stock' : stock <= (producto.stockMinimo ?? 3) ? 'Últimas unidades' : 'En stock');
  const sinStock = estadoStock === 'Sin stock' || stock <= 0;
  const ultimasUnidades = estadoStock === 'Últimas unidades';
  const isTanuki = String(producto.categoria).toLowerCase() === 'tanuki';

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = addToCart(producto, 1);
    showToast(res.message, res.ok ? 'success' : 'warning');
  };

  return (
    <div
      className={`flex flex-col justify-between p-space-md rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 transition-all group shadow-lg ${
        isTanuki
          ? 'hover:border-pine/80 hover:shadow-pine-glow'
          : 'hover:border-primary-container/60 hover:shadow-gold-card'
      }`}
    >
      <div>
        {/* Contenedor de imagen */}
        <Link
          to={`/producto/${producto.id}`}
          className="relative w-full aspect-square rounded bg-surface-container-lowest border border-outline-variant/40 overflow-hidden flex items-center justify-center p-3 mb-space-md block"
        >
          {sinStock ? (
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-error-container/70 border border-error/50 text-error font-label-sm text-label-sm">
              Sin stock
            </span>
          ) : ultimasUnidades ? (
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-secondary-container/40 border border-vermilion/60 text-secondary font-label-sm text-label-sm">
              Últimas unidades ({stock} u.)
            </span>
          ) : (
            <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-surface-container-high border border-primary-container/50 text-primary font-label-sm text-label-sm">
              En stock
            </span>
          )}

          <span className="absolute top-2 right-2 z-10 font-label-sm text-label-sm text-outline uppercase">
            {producto.marca}
          </span>

          <img
            src={producto.imagen}
            alt={producto.nombre}
            loading="lazy"
            className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ${
              sinStock ? 'opacity-50 grayscale' : ''
            }`}
          />
        </Link>

        {/* Etiqueta Yokai */}
        <span
          className={`font-label-sm text-label-sm uppercase tracking-wider font-semibold ${
            isTanuki ? 'text-tertiary' : 'text-primary'
          }`}
        >
          {producto.etiquetaYokai || `${producto.categoria} // ${producto.marca}`}
        </span>

        {/* Título */}
        <Link to={`/producto/${producto.id}`}>
          <h3 className="font-headline-sm text-[16px] text-on-surface-bright hover:text-primary font-semibold mt-1 line-clamp-2 transition-colors">
            {producto.nombre}
          </h3>
        </Link>

        {/* Subtítulo técnico corto */}
        <p className="font-body-sm text-body-sm text-outline mt-1 line-clamp-1">
          {producto.subtituloCorto || producto.descripcion}
        </p>
      </div>

      {/* Precio (fuente de verdad: servidor) y botón Agregar al Carrito */}
      <div className="mt-space-md pt-space-sm border-t border-outline-variant/40 flex flex-col gap-2">
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-on-surface-bright font-bold tracking-tight">
            {formatARS(producto.precio)}
          </span>
          {producto.sku && (
            <span className="font-body-sm text-body-sm text-outline">
              SKU: {producto.sku}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={sinStock || cartBusy}
          onClick={handleAdd}
          className={`disabled:opacity-60 disabled:cursor-not-allowed w-full mt-2 min-h-[44px] py-2.5 px-4 rounded font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
            sinStock
              ? 'bg-surface-container-high text-outline border-outline-variant/40 cursor-not-allowed'
              : 'bg-vermilion hover:bg-vermilion-dark text-white border-secondary/30 shadow-vermilion-sm'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {sinStock ? 'block' : 'shopping_bag'}
          </span>
          <span>{sinStock ? 'Sin stock' : 'Agregar al carrito'}</span>
        </button>
      </div>
    </div>
  );
}
