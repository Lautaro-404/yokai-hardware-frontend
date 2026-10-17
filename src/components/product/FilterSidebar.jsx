import React, { useState, useEffect } from 'react';

export default function FilterSidebar({
  categorias = [],
  marcas = [],
  filtros,
  onChangeFiltro,
  onClearFiltros,
}) {
  const [minInput, setMinInput] = useState(filtros.precioMin || '');
  const [maxInput, setMaxInput] = useState(filtros.precioMax || '');

  useEffect(() => {
    setMinInput(filtros.precioMin || '');
    setMaxInput(filtros.precioMax || '');
  }, [filtros.precioMin, filtros.precioMax]);

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    onChangeFiltro({
      precioMin: minInput,
      precioMax: maxInput,
    });
  };

  const hasActiveFilters = Boolean(
    filtros.categoria ||
      filtros.marca ||
      filtros.precioMin ||
      filtros.precioMax ||
      filtros.q
  );

  return (
    <aside className="w-full rounded bg-surface-container-low border border-outline-variant/60 p-space-md flex flex-col gap-space-lg shadow-lg">
      <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            tune
          </span>
          <h3 className="font-headline-sm text-[17px] text-on-surface-bright font-semibold">
            Filtros del Santuario
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFiltros}
            className="font-label-sm text-label-sm text-secondary hover:text-on-surface-bright uppercase tracking-wider transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Categorías Yokai */}
      <div className="flex flex-col gap-space-sm">
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">
          Espíritus / Categorías
        </span>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onChangeFiltro({ categoria: '' })}
            className={`w-full text-left px-3 py-2 rounded font-body-sm text-body-sm flex items-center justify-between transition-colors ${
              !filtros.categoria
                ? 'bg-primary-container text-on-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface-bright'
            }`}
          >
            <span>Todas las categorías</span>
            <span className="font-serif text-xs">全</span>
          </button>
          {categorias.map((cat) => {
            const active =
              String(filtros.categoria).toLowerCase() ===
              String(cat.nombre).toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onChangeFiltro({ categoria: active ? '' : cat.nombre })
                }
                className={`w-full text-left px-3 py-2 rounded font-body-sm text-body-sm flex items-center justify-between transition-colors ${
                  active
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface-bright'
                }`}
              >
                <div className="flex flex-col">
                  <span className="leading-tight">{cat.subtitulo}</span>
                  <span
                    className={`font-label-sm text-[10px] uppercase tracking-wider ${
                      active ? 'text-on-primary/80' : 'text-outline'
                    }`}
                  >
                    {cat.nombre}
                  </span>
                </div>
                <span className="font-serif text-sm">{cat.kanji}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango de Precio en ARS */}
      <form
        onSubmit={handlePriceSubmit}
        className="flex flex-col gap-space-sm pt-space-sm border-t border-outline-variant/40"
      >
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">
          Rango de Precio (ARS)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-label-sm text-label-sm text-outline block mb-1">
              Mínimo ($)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Ej: 100000"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-2.5 py-2 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-outline block mb-1">
              Máximo ($)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Ej: 1500000"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-2.5 py-2 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 px-3 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-primary border border-primary-container/40 font-label-md text-label-md uppercase tracking-wider transition-colors"
        >
          Aplicar Rango
        </button>
      </form>

      {/* Marcas */}
      <div className="flex flex-col gap-space-sm pt-space-sm border-t border-outline-variant/40">
        <span className="font-label-md text-label-md text-primary uppercase tracking-wider font-semibold">
          Marca / Forjador
        </span>
        <div className="flex flex-wrap gap-1.5">
          {marcas.map((m) => {
            const active =
              String(filtros.marca).toLowerCase() ===
              String(m.nombre).toLowerCase();
            return (
              <button
                key={m.id || m.nombre}
                type="button"
                onClick={() => onChangeFiltro({ marca: active ? '' : m.nombre })}
                className={`px-2.5 py-1 rounded font-label-sm text-label-sm uppercase tracking-wider border transition-colors ${
                  active
                    ? 'bg-vermilion text-white border-secondary/50 shadow-vermilion-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:border-primary-container/60 hover:text-on-surface-bright'
                }`}
              >
                {m.nombre}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
