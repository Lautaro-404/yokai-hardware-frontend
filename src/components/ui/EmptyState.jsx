import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  kanji = '空',
  icon = 'inventory_2',
  title = 'No se encontraron resultados',
  description = 'Probá ajustando los filtros de búsqueda o explorando otra categoría espiritual.',
  actionLabel = 'Explorar catálogo',
  actionTo = '/catalogo',
  onActionClick = null,
}) {
  return (
    <div className="relative overflow-hidden rounded bg-surface-container-low border border-outline-variant/60 p-space-xl text-center flex flex-col items-center justify-center min-h-[300px] shadow-lg">
      <span className="pointer-events-none select-none absolute -right-4 -bottom-6 font-serif text-[140px] text-outline-variant/15 leading-none">
        {kanji}
      </span>
      <div className="w-14 h-14 rounded bg-surface-container-high border border-primary-container/40 flex items-center justify-center mb-space-md shadow-md">
        <span className="material-symbols-outlined text-primary text-[28px]">
          {icon}
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface-bright mb-2">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-outline max-w-md mb-space-lg">
        {description}
      </p>
      {onActionClick ? (
        <button
          onClick={onActionClick}
          className="px-6 py-3 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-lg text-label-lg uppercase tracking-wider transition-all border border-secondary/30 shadow-vermilion-sm"
        >
          {actionLabel}
        </button>
      ) : (
        actionTo && (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-lg text-label-lg uppercase tracking-wider transition-all border border-secondary/30 shadow-vermilion-sm"
          >
            <span>{actionLabel}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        )
      )}
    </div>
  );
}
