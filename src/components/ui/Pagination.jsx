import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-2 pt-space-lg">
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-2 rounded bg-surface-container-low hover:bg-surface-container-high disabled:opacity-40 disabled:pointer-events-none border border-outline-variant/60 text-on-surface-variant font-label-md flex items-center gap-1 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        <span>Anterior</span>
      </button>

      <div className="flex items-center gap-1.5">
        {pages.map((p) => {
          const isCurrent = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded font-label-md text-label-md transition-all border ${
                isCurrent
                  ? 'bg-primary-container text-on-primary font-bold border-primary-fixed/50 shadow-md'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface-bright hover:bg-surface-container-high border-outline-variant/60'
              }`}
            >
              {p + 1}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-2 rounded bg-surface-container-low hover:bg-surface-container-high disabled:opacity-40 disabled:pointer-events-none border border-outline-variant/60 text-on-surface-variant font-label-md flex items-center gap-1 transition-colors"
      >
        <span>Siguiente</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  );
}
