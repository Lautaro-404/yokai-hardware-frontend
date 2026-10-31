import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  // Ventana de páginas visibles adaptativa para evitar desbordes en móvil (375 px)
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const current = page;
    let start = Math.max(0, current - 1);
    let end = Math.min(totalPages - 1, current + 1);

    if (current === 0) {
      end = Math.min(totalPages - 1, 2);
    } else if (current === totalPages - 1) {
      start = Math.max(0, totalPages - 3);
    }

    const pages = [];
    if (start > 0) {
      pages.push(0);
      if (start > 1) pages.push('ellipsis-start');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      if (end < totalPages - 2) pages.push('ellipsis-end');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      aria-label="Paginación de resultados"
      className="flex flex-wrap items-center justify-center gap-2 pt-space-lg select-none"
    >
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
        className="px-3 py-2 min-h-[40px] rounded bg-surface-container-low hover:bg-surface-container-high disabled:opacity-40 disabled:pointer-events-none border border-outline-variant/60 text-on-surface-variant font-label-md flex items-center gap-1 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {visiblePages.map((item, index) => {
          if (typeof item === 'string') {
            return (
              <span
                key={`${item}-${index}`}
                className="w-7 h-9 flex items-center justify-center text-outline font-bold"
              >
                …
              </span>
            );
          }

          const isCurrent = item === page;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={isCurrent ? 'page' : undefined}
              aria-label={`Ir a la página ${item + 1}`}
              className={`min-w-[38px] h-10 px-2 rounded font-label-md text-label-md transition-all border flex items-center justify-center ${
                isCurrent
                  ? 'bg-primary-container text-on-primary font-bold border-primary-fixed/50 shadow-md'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface-bright hover:bg-surface-container-high border-outline-variant/60'
              }`}
            >
              {item + 1}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
        className="px-3 py-2 min-h-[40px] rounded bg-surface-container-low hover:bg-surface-container-high disabled:opacity-40 disabled:pointer-events-none border border-outline-variant/60 text-on-surface-variant font-label-md flex items-center gap-1 transition-colors"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </nav>
  );
}
