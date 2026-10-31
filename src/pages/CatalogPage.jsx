import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getProductos } from '../api/productos';
import { getCategorias } from '../api/categorias';
import { getMarcas } from '../api/marcas';
import ProductCard from '../components/product/ProductCard';
import FilterSidebar from '../components/product/FilterSidebar';
import Pagination from '../components/ui/Pagination';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import { formatARS } from '../utils/formatters';

const PAGE_SIZE = 8;

const DISPONIBILIDAD_LABELS = {
  EN_STOCK: 'En stock',
  ULTIMAS_UNIDADES: 'Últimas unidades',
  SIN_STOCK: 'Sin stock',
  DISPONIBLE: 'Disponible',
};

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lectura de filtros desde los query params de la URL
  const filtros = {
    categoria: searchParams.get('categoria') || '',
    marca: searchParams.get('marca') || '',
    disponibilidad: searchParams.get('disponibilidad') || '',
    precioMin: searchParams.get('precioMin') || '',
    precioMax: searchParams.get('precioMax') || '',
    q: searchParams.get('q') || '',
    orden: searchParams.get('orden') || '',
    page: Math.max(0, Number(searchParams.get('page') || 0)),
  };

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [productosData, setProductosData] = useState({
    content: [],
    totalPages: 1,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localSearch, setLocalSearch] = useState(filtros.q);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setLocalSearch(filtros.q);
  }, [filtros.q]);

  // Carga de categorías y marcas para el sidebar
  useEffect(() => {
    Promise.all([getCategorias(), getMarcas()])
      .then(([cats, mrcs]) => {
        setCategorias(cats);
        setMarcas(mrcs);
      })
      .catch(() => {});
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductos({
        ...filtros,
        size: PAGE_SIZE,
      });
      setProductosData(res);
    } catch (err) {
      setError(
        err?.message || 'Error al consultar el catálogo de productos.'
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtros.categoria,
    filtros.marca,
    filtros.disponibilidad,
    filtros.precioMin,
    filtros.precioMax,
    filtros.q,
    filtros.orden,
    filtros.page,
  ]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const updateUrlParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, val]) => {
      if (val === '' || val === null || val === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    // Si cambia cualquier filtro distinto de page, volvemos a la página 0
    if (!('page' in changes)) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setSearchParams({});
  };

  const handleSearchForm = (e) => {
    e.preventDefault();
    updateUrlParams({ q: localSearch.trim() });
  };

  const activeCategoryObj = categorias.find(
    (c) => String(c.nombre).toLowerCase() === String(filtros.categoria).toLowerCase()
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
      {/* Encabezado del Catálogo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/40">
        <div>
          <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm uppercase tracking-widest mb-2">
            <Link to="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-primary">Catálogo</span>
            {activeCategoryObj && (
              <>
                <span>/</span>
                <span className="text-secondary">
                  {activeCategoryObj.nombre} ({activeCategoryObj.subtitulo})
                </span>
              </>
            )}
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright flex items-center gap-3">
            {activeCategoryObj ? (
              <>
                <span className="font-serif text-primary">
                  {activeCategoryObj.kanji}
                </span>
                <span>
                  {activeCategoryObj.subtitulo} — Espíritu {activeCategoryObj.nombre}
                </span>
              </>
            ) : (
              'Catálogo Espiritual de Hardware'
            )}
          </h1>
          <p className="font-body-md text-body-md text-outline mt-1">
            {activeCategoryObj
              ? activeCategoryObj.descripcion
              : 'Explorá componentes de alto rendimiento con garantía oficial en Argentina.'}
          </p>
        </div>

        {/* Buscador y Selector de Orden */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form onSubmit={handleSearchForm} className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar modelo o marca..."
              className="w-full sm:w-60 bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm pl-9 pr-3 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={filtros.orden}
              onChange={(e) => updateUrlParams({ orden: e.target.value })}
              aria-label="Ordenar productos"
              className="flex-1 sm:w-52 bg-surface-container-low text-on-surface text-body-sm px-3 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
            >
              <option value="">Orden: Destacados Yokai</option>
              <option value="precio_asc">Precio: Menor a Mayor</option>
              <option value="precio_desc">Precio: Mayor a Menor</option>
              <option value="nombre_asc">Nombre: A - Z</option>
              <option value="stock_desc">Mayor disponibilidad</option>
            </select>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="lg:hidden px-3 py-2.5 rounded bg-surface-container-low border border-primary-container/50 text-primary font-label-md flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">
                filter_list
              </span>
              <span>Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Layout de 12 columnas: Sidebar (3) + Grilla (9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Sidebar de Filtros */}
        <div
          className={`lg:col-span-3 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <FilterSidebar
            categorias={categorias}
            marcas={marcas}
            filtros={filtros}
            onChangeFiltro={updateUrlParams}
            onClearFiltros={clearAllFilters}
          />
        </div>

        {/* Contenido Principal del Catálogo */}
        <div className="lg:col-span-9 flex flex-col gap-space-md">
          {/* Barra de estado de resultados y chips de filtros activos */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded bg-surface-container-low border border-outline-variant/50">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Mostrando{' '}
              <strong className="text-on-surface-bright">
                {productosData.content.length}
              </strong>{' '}
              de{' '}
              <strong className="text-primary">
                {productosData.totalElements}
              </strong>{' '}
              componentes encontrados
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {filtros.categoria && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high border border-primary-container/50 text-primary font-label-sm">
                  Categoría: {filtros.categoria}
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ categoria: '' })}
                    className="hover:text-on-surface-bright"
                  >
                    ×
                  </button>
                </span>
              )}
              {filtros.marca && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high border border-vermilion/50 text-secondary font-label-sm">
                  Marca: {filtros.marca}
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ marca: '' })}
                    className="hover:text-on-surface-bright"
                  >
                    ×
                  </button>
                </span>
              )}
              {filtros.disponibilidad && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high border border-pine text-tertiary font-label-sm">
                  Disponibilidad:{' '}
                  {DISPONIBILIDAD_LABELS[filtros.disponibilidad] ||
                    filtros.disponibilidad}
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ disponibilidad: '' })}
                    className="hover:text-on-surface-bright"
                  >
                    ×
                  </button>
                </span>
              )}
              {(filtros.precioMin || filtros.precioMax) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant font-label-sm">
                  Precio: {filtros.precioMin ? formatARS(filtros.precioMin) : '$0'} -{' '}
                  {filtros.precioMax ? formatARS(filtros.precioMax) : 'Máx'}
                  <button
                    type="button"
                    onClick={() =>
                      updateUrlParams({ precioMin: '', precioMax: '' })
                    }
                    className="hover:text-on-surface-bright"
                  >
                    ×
                  </button>
                </span>
              )}
              {filtros.q && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant font-label-sm">
                  Búsqueda: &ldquo;{filtros.q}&rdquo;
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ q: '' })}
                    className="hover:text-on-surface-bright"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Grilla de Productos o Estados */}
          {error ? (
            <ErrorMessage message={error} onRetry={fetchCatalog} />
          ) : loading ? (
            <ProductGridSkeleton count={6} />
          ) : productosData.content.length === 0 ? (
            <EmptyState
              kanji="無"
              icon="search_off"
              title="No encontramos componentes con esos filtros"
              description="Probá ampliando el rango de precio, cambiando el filtro de disponibilidad o limpiando los filtros activos."
              actionLabel="Restablecer todos los filtros"
              onActionClick={clearAllFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md">
                {productosData.content.map((prod) => (
                  <ProductCard key={prod.id} producto={prod} />
                ))}
              </div>
              <Pagination
                page={filtros.page}
                totalPages={productosData.totalPages}
                onPageChange={(newPage) => updateUrlParams({ page: newPage })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
