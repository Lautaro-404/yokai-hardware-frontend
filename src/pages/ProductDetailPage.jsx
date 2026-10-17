import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductoById, getProductos } from '../api/productos';
import { formatARS, getTransferPrice, getInstallmentPrice } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/product/ProductCard';
import { DetailPageSkeleton } from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [activeTab, setActiveTab] = useState('especificaciones');
  const [selectedThumb, setSelectedThumb] = useState(0);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCantidad(1);
    setSelectedThumb(0);
    try {
      const prod = await getProductoById(id);
      setProducto(prod);

      const relData = await getProductos({
        categoria: prod.categoria,
        page: 0,
        size: 5,
      });
      setRelacionados(
        (relData.content || [])
          .filter((p) => Number(p.id) !== Number(prod.id))
          .slice(0, 4)
      );
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el detalle del producto.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (loading) return <DetailPageSkeleton />;

  if (error || !producto) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <ErrorMessage
          title="Componente no encontrado"
          message={error || 'El producto solicitado no está disponible.'}
          onRetry={loadProduct}
        />
        <div className="mt-space-md">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-fixed font-label-md uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Volver al catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  const stock = Number(producto.stock ?? 0);
  const sinStock = stock <= 0;
  const specsEntries = Object.entries(producto.especificaciones || {});

  // Vistas de galería simuladas con encuadres sobre la imagen del producto
  const galleryViews = [
    { label: 'Vista Principal', scaleClass: 'scale-100' },
    { label: 'Detalle Chasis', scaleClass: 'scale-110 -rotate-2' },
    { label: 'Ángulo Técnico', scaleClass: 'scale-105 translate-y-1' },
  ];

  const handleAddToCart = () => {
    const res = addToCart(producto, cantidad);
    showToast(res.message, res.ok ? 'success' : 'warning');
  };

  const handleBuyNow = () => {
    const res = addToCart(producto, cantidad);
    if (res.ok) {
      navigate('/carrito');
    } else {
      showToast(res.message, 'warning');
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-outline font-label-sm text-label-sm uppercase tracking-widest mb-space-lg">
        <Link to="/" className="hover:text-primary transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <Link to="/catalogo" className="hover:text-primary transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <Link
          to={`/catalogo?categoria=${encodeURIComponent(producto.categoria)}`}
          className="hover:text-primary transition-colors text-primary"
        >
          {producto.categoria}
        </Link>
        <span>/</span>
        <span className="text-on-surface-variant truncate max-w-xs">
          {producto.nombre}
        </span>
      </nav>

      {/* Bloque Principal: Galería (Izquierda) + Información de Compra (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        {/* Columna Izquierda: Galería */}
        <div className="lg:col-span-6 flex flex-col gap-space-md">
          <div className="relative w-full aspect-square rounded bg-surface-container-lowest border border-primary-container/40 overflow-hidden flex items-center justify-center p-8 shadow-2xl">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded bg-surface-container-low/90 border border-primary-container/50 text-primary font-label-sm text-label-sm uppercase tracking-widest">
                {producto.etiquetaYokai || `${producto.categoria} // ${producto.marca}`}
              </span>
            </div>
            <span className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded bg-surface-container-high/80 border border-outline-variant/60 font-label-sm text-label-sm text-on-surface-variant uppercase">
              {producto.marca}
            </span>

            <img
              src={producto.imagen}
              alt={producto.nombre}
              className={`w-full h-full object-contain transition-transform duration-500 ${galleryViews[selectedThumb]?.scaleClass}`}
            />
          </div>

          {/* Miniaturas de galería */}
          <div className="grid grid-cols-3 gap-space-sm">
            {galleryViews.map((view, idx) => (
              <button
                key={view.label}
                type="button"
                onClick={() => setSelectedThumb(idx)}
                className={`p-2 rounded bg-surface-container-low border transition-all flex flex-col items-center gap-1 ${
                  selectedThumb === idx
                    ? 'border-primary-container shadow-gold-glow'
                    : 'border-outline-variant/50 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-16 h-16 overflow-hidden flex items-center justify-center">
                  <img
                    src={producto.imagen}
                    alt={view.label}
                    className={`w-full h-full object-contain ${view.scaleClass}`}
                  />
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {view.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Ficha Comercial */}
        <div className="lg:col-span-6 flex flex-col gap-space-md p-space-lg rounded bg-surface-container-low border border-outline-variant/60 shadow-xl">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-label-md text-label-md text-primary uppercase tracking-widest font-semibold">
              Espíritu {producto.categoria} • {producto.marca}
            </span>
            {sinStock ? (
              <span className="px-3 py-1 rounded bg-error-container/70 border border-error/50 text-error font-label-sm text-label-sm uppercase">
                Agotado Temporalmente
              </span>
            ) : stock <= 3 ? (
              <span className="px-3 py-1 rounded bg-secondary-container/40 border border-vermilion/60 text-secondary font-label-sm text-label-sm uppercase">
                ¡Últimas {stock} unidades en stock!
              </span>
            ) : (
              <span className="px-3 py-1 rounded bg-pine/30 border border-pine text-tertiary font-label-sm text-label-sm uppercase">
                Stock Disponible ({stock} unidades)
              </span>
            )}
          </div>

          <h1 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright leading-tight">
            {producto.nombre}
          </h1>

          {producto.subtituloCorto && (
            <p className="font-label-lg text-label-lg text-outline">
              {producto.subtituloCorto}
            </p>
          )}

          {/* Bloque de precios en ARS */}
          <div className="p-space-md rounded bg-surface-container-lowest border border-primary-container/30 flex flex-col gap-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Precio de Lista
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface-bright font-bold">
                {formatARS(producto.precio)}
              </span>
            </div>

            <div className="pt-2 border-t border-outline-variant/40 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-secondary">
                <span className="font-label-md text-label-md flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">
                    account_balance
                  </span>
                  <span>Transferencia o Depósito (-10% OFF)</span>
                </span>
                <span className="font-headline-sm text-[18px] font-bold">
                  {formatARS(getTransferPrice(producto.precio))}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    credit_card
                  </span>
                  <span>6 cuotas fijas con tarjeta bancaria</span>
                </span>
                <span className="text-primary font-semibold">
                  6x {formatARS(getInstallmentPrice(producto.precio, 6))}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Cantidad + Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md pt-space-xs">
            <div className="flex items-center justify-between sm:justify-start bg-surface-container-lowest border border-outline-variant/70 rounded px-2 py-1.5">
              <span className="font-label-sm text-label-sm text-outline uppercase px-2 sm:hidden">
                Cantidad:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sinStock || cantidad <= 1}
                  onClick={() => setCantidad((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary disabled:opacity-40 disabled:pointer-events-none text-on-surface-bright flex items-center justify-center transition-colors"
                  aria-label="Disminuir cantidad"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="w-8 text-center font-label-lg text-label-lg text-on-surface-bright">
                  {sinStock ? 0 : cantidad}
                </span>
                <button
                  type="button"
                  disabled={sinStock || cantidad >= stock}
                  onClick={() => setCantidad((q) => Math.min(stock, q + 1))}
                  className="w-8 h-8 rounded bg-surface-container-high hover:bg-primary-container hover:text-on-primary disabled:opacity-40 disabled:pointer-events-none text-on-surface-bright flex items-center justify-center transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={sinStock}
              onClick={handleAddToCart}
              className={`flex-1 py-3.5 px-6 rounded font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
                sinStock
                  ? 'bg-surface-container-high text-outline border-outline-variant/40 cursor-not-allowed'
                  : 'bg-vermilion hover:bg-vermilion-dark text-white border-secondary/30 shadow-vermilion-glow'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                shopping_bag
              </span>
              <span>{sinStock ? 'Sin Stock' : 'Agregar al carrito'}</span>
            </button>

            {!sinStock && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="py-3.5 px-5 rounded bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider transition-colors border border-primary-fixed/40"
              >
                Comprar ahora
              </button>
            )}
          </div>

          {/* Garantías rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-space-sm border-t border-outline-variant/40 font-label-sm text-label-sm text-on-surface-variant">
            <div className="flex items-center gap-2 p-2 rounded bg-surface-container">
              <span className="material-symbols-outlined text-primary text-[18px]">
                local_shipping
              </span>
              <span>Despacho en 24hs a todo el país</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-surface-container">
              <span className="material-symbols-outlined text-primary text-[18px]">
                verified_user
              </span>
              <span>Garantía Oficial en Argentina</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-surface-container">
              <span className="material-symbols-outlined text-primary text-[18px]">
                receipt_long
              </span>
              <span>Factura A o B electrónica</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Descripción y Especificaciones */}
      <div className="mt-space-xl rounded bg-surface-container-low border border-outline-variant/60 overflow-hidden shadow-xl">
        <div className="flex items-center border-b border-outline-variant/50 bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setActiveTab('especificaciones')}
            className={`px-6 py-4 font-label-lg text-label-lg uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'especificaciones'
                ? 'border-primary text-primary bg-surface-container-low'
                : 'border-transparent text-outline hover:text-on-surface-bright'
            }`}
          >
            Especificaciones Técnicas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('descripcion')}
            className={`px-6 py-4 font-label-lg text-label-lg uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'descripcion'
                ? 'border-primary text-primary bg-surface-container-low'
                : 'border-transparent text-outline hover:text-on-surface-bright'
            }`}
          >
            Descripción del Espíritu
          </button>
        </div>

        <div className="p-space-lg">
          {activeTab === 'especificaciones' ? (
            specsEntries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specsEntries.map(([clave, valor]) => (
                  <div
                    key={clave}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded bg-surface-container border border-outline-variant/40 gap-1"
                  >
                    <span className="font-label-md text-label-md text-primary uppercase tracking-wider">
                      {clave}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-bright font-medium sm:text-right">
                      {String(valor)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-md text-outline">
                Especificaciones técnicas certificadas por el fabricante ({producto.marca}).
              </p>
            )
          ) : (
            <div className="max-w-3xl flex flex-col gap-space-md">
              <h3 className="font-headline-md text-headline-md text-on-surface-bright">
                {producto.nombre}
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                {producto.descripcion}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Productos Relacionados */}
      {relacionados.length > 0 && (
        <section className="mt-space-xl pt-space-lg border-t border-outline-variant/40">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
                Mismo Linaje Espiritual
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface-bright">
                Otros componentes {producto.categoria}
              </h2>
            </div>
            <Link
              to={`/catalogo?categoria=${encodeURIComponent(producto.categoria)}`}
              className="font-label-md text-label-md text-primary hover:text-primary-fixed flex items-center gap-1"
            >
              <span>Ver todos</span>
              <span className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {relacionados.map((rel) => (
              <ProductCard key={rel.id} producto={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
