import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCategorias } from '../api/categorias';
import { getProductos } from '../api/productos';
import { DEFAULT_HERO_IMAGE_URL } from '../utils/constants';
import { formatARS } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import CategoryCard from '../components/product/CategoryCard';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';

const FEATURED_TABS = [
  { id: 'ALL', label: 'Todos', categoria: '' },
  { id: 'ONI', label: 'Placas de video', categoria: 'Oni' },
  { id: 'KITSUNE', label: 'Procesadores', categoria: 'Kitsune' },
  { id: 'TENGU', label: 'Memorias', categoria: 'Tengu' },
  { id: 'YUREI', label: 'Gabinetes', categoria: 'Yurei' },
];

export default function HomePage() {
  const { showToast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [heroProduct, setHeroProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const loadHomeData = useCallback(async (selectedCategory = '') => {
    setLoading(true);
    setError(null);
    try {
      const [catsData, prodsData] = await Promise.all([
        getCategorias(),
        getProductos({
          categoria: selectedCategory,
          page: 0,
          size: 8,
        }),
      ]);
      const list = prodsData.content || [];
      setCategorias(catsData || []);
      setProductos(list);
      if (!selectedCategory && list.length > 0) {
        const featured = list.find((p) => p.destacado) || list[0];
        setHeroProduct(featured);
      }
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los componentes destacados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const tabObj = FEATURED_TABS.find((t) => t.id === activeTab);
    loadHomeData(tabObj?.categoria || '');
  }, [activeTab, loadHomeData]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    showToast(
      `¡Bienvenido al santuario Yokai! Suscribimos a ${newsletterEmail.trim()} a las alertas de stock.`,
      'success'
    );
    setNewsletterEmail('');
  };

  return (
    <>
      {/* SECTION 1: HERO SECTION */}
      <section className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-6 flex flex-col gap-space-lg">
            {/* Eyebrow Badge */}
            <div className="flex items-center gap-space-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-vermilion/50 bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-widest shadow-[0_0_15px_rgba(200,62,45,0.25)]">
                <span className="w-2 h-2 rounded-full bg-vermilion animate-ping" />
                EDICIÓN ESPECIAL ONI // TEMPORADA 2026
              </span>
              <span className="font-label-sm text-label-sm text-outline tracking-widest hidden sm:inline-block">
                鬼の覚醒 • 金箔墨絵 MK-VII
              </span>
            </div>

            {/* Main Title with Japanese Accent */}
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="font-headline-sm text-headline-sm text-primary tracking-widest uppercase">
                  魂を宿すマシン
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-primary-container/50 via-vermilion/30 to-transparent" />
              </div>
              <h1 className="font-display-lg text-display-lg-mobile sm:text-display-lg font-normal text-on-surface-bright leading-[1.12] tracking-tight">
                Armá tu PC <br />
                con{' '}
                <span className="bg-gradient-to-r from-primary via-primary-fixed to-secondary bg-clip-text text-transparent italic font-serif">
                  espíritu
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
              Componentes de alta gama forjados con el poder de leyendas ancestrales.
              Rendimiento extremo, refrigeración mística y garantía oficial en
              Argentina con despacho asegurado.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
              <Link
                to="/catalogo"
                className="flex items-center gap-2 px-7 py-3.5 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-lg text-label-lg uppercase tracking-wider transition-all shadow-vermilion-glow hover:shadow-vermilion-glow-lg border border-secondary/30 group"
              >
                <span>Ver catálogo</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </Link>
              <Link
                to="/catalogo?categoria=Kitsune"
                className="flex items-center gap-2 px-6 py-3.5 rounded bg-surface-container-low hover:bg-surface-container-high text-primary hover:text-primary-fixed border border-primary-container/40 font-label-lg text-label-lg uppercase tracking-wider transition-all shadow-[0_2px_12px_rgba(0,0,0,0.5)] group"
              >
                <span className="material-symbols-outlined text-[18px] text-primary group-hover:text-primary-fixed transition-colors">
                  local_fire_department
                </span>
                <span>Explorar Procesadores</span>
              </Link>
            </div>

            {/* Micro Specs Pill Strip */}
            <div className="pt-space-sm flex flex-wrap items-center gap-y-2 gap-x-4 text-on-surface-variant font-label-md text-label-md">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  inventory_2
                </span>
                <span>Stock en tiempo real</span>
              </div>
              <span className="text-outline-variant">•</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  local_shipping
                </span>
                <span>Envíos a todo el país</span>
              </div>
              <span className="text-outline-variant">•</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  verified_user
                </span>
                <span>Garantía oficial directa</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-container/25 via-secondary-container/20 to-transparent rounded blur-2xl transform scale-95 -z-10" />
            <Link
              to={heroProduct ? `/producto/${heroProduct.id}` : '/catalogo'}
              className="relative w-full rounded overflow-hidden bg-surface-container-lowest border border-primary-container/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] group block"
            >
              <img
                alt={heroProduct?.nombre || 'Componente Destacado Yokai Hardware'}
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                src={heroProduct?.imagen || DEFAULT_HERO_IMAGE_URL}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-85" />

              {/* Top-Left Kanji Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded bg-surface-container-lowest/90 border border-primary-container/50 backdrop-blur-md flex items-center gap-2 shadow-lg">
                <span className="font-headline-sm text-headline-sm text-secondary leading-none font-serif">
                  鬼
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-bright tracking-widest uppercase">
                  {heroProduct?.etiquetaYokai || 'ONI GPU SERIES'}
                </span>
              </div>

              {/* Bottom Floating Hardware Spec Overlay Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded bg-surface-container-low/95 border border-outline-variant/80 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                    {heroProduct?.estadoStock || 'Destacado del Santuario'}
                  </span>
                  <h3 className="font-headline-sm text-[17px] text-on-surface-bright font-semibold group-hover:text-primary transition-colors">
                    {heroProduct?.nombre || 'Explorar Catálogo de Hardware'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline line-clamp-1">
                    {heroProduct?.subtituloCorto ||
                      'Componentes certificados de alto rendimiento'}
                  </p>
                </div>
                {heroProduct && (
                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between shrink-0">
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold tracking-tight">
                      {formatARS(heroProduct.precio)}
                    </span>
                    <span className="font-label-sm text-label-sm text-primary uppercase font-semibold">
                      {heroProduct.marca}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: CATEGORÍAS YOKAI */}
      <section className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
                Catálogo Espiritual
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright">
              Categorías Forjadas
            </h2>
            <p className="font-body-md text-body-md text-outline">
              Elegí el espíritu ancestral que impulsará el corazón de tu setup.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary hover:text-primary-fixed transition-colors group"
          >
            <span>Explorar todos los componentes</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Category 6-Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-space-md">
          {categorias.map((cat) => (
            <CategoryCard key={cat.id} categoria={cat} />
          ))}
        </div>
      </section>

      {/* SECTION 3: PRODUCTOS DESTACADOS */}
      <section className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-vermilion" />
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
                SELECCIÓN DE ÉLITE
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright">
              Productos Destacados
            </h2>
            <p className="font-body-md text-body-md text-outline">
              Stock en tiempo real y precios oficiales provistos por el servidor.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            {FEATURED_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    isActive
                      ? 'px-3.5 py-1.5 rounded bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-sm border border-primary-fixed/40 transition-colors'
                      : 'px-3.5 py-1.5 rounded bg-surface-container-low text-on-surface-variant hover:text-on-surface-bright hover:bg-surface-container-high border border-outline-variant/60 transition-colors font-label-md text-label-md'
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {error ? (
          <ErrorMessage
            message={error}
            onRetry={() => {
              const tabObj = FEATURED_TABS.find((t) => t.id === activeTab);
              loadHomeData(tabObj?.categoria || '');
            }}
          />
        ) : loading ? (
          <ProductGridSkeleton count={8} />
        ) : productos.length === 0 ? (
          <EmptyState
            kanji="無"
            icon="inventory_2"
            title="No hay productos disponibles en esta categoría"
            description="Seleccioná otra pestaña espiritual o explorá el catálogo completo."
            actionLabel="Ver todo el catálogo"
            actionTo="/catalogo"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {productos.map((prod) => (
              <ProductCard key={prod.id} producto={prod} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4: PROMO STRIP (3 BENEFITS) */}
      <section className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <div className="p-space-xl rounded bg-surface-container-low/95 border border-outline-variant/60 backdrop-blur-xl relative overflow-hidden shadow-xl">
          <div className="absolute -right-8 -bottom-10 text-[180px] font-bold text-outline-variant/15 select-none pointer-events-none font-serif">
            神社
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-xl relative z-10">
            {/* Benefit 1 */}
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded bg-surface-container-high border border-primary-container/50 flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-primary text-[26px]">
                  local_shipping
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-headline-sm text-[18px] text-on-surface-bright font-semibold">
                  Envíos a todo el país
                </h4>
                <p className="font-body-sm text-body-sm text-outline leading-relaxed">
                  Despacho asegurado a domicilio o sucursal en 24/48hs con embalaje
                  reforzado antiestático especial.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded bg-surface-container-high border border-vermilion/50 flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-secondary text-[26px]">
                  credit_card
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-headline-sm text-[18px] text-on-surface-bright font-semibold">
                  Medios de pago habilitados
                </h4>
                <p className="font-body-sm text-body-sm text-outline leading-relaxed">
                  Operá con transferencia bancaria o tarjeta de crédito con confirmación
                  y reserva inmediata de stock.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded bg-surface-container-high border border-pine flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-tertiary text-[26px]">
                  verified_user
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="font-headline-sm text-[18px] text-on-surface-bright font-semibold">
                  Garantía oficial
                </h4>
                <p className="font-body-sm text-body-sm text-outline leading-relaxed">
                  Componentes nuevos en caja sellada de fábrica con soporte técnico
                  local en Argentina.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: NEWSLETTER / COMUNIDAD YOKAI BANNER */}
      <section className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl mb-12">
        <div className="relative p-space-xl rounded bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-primary-container/40 overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-space-xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary-container/15 blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-space-xs text-center lg:text-left z-10 max-w-xl">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-vermilion" />
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold">
                COMUNIDAD &amp; ALERTAS DE STOCK
              </span>
            </div>
            <h3 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface-bright">
              Unite al santuario de hardware
            </h3>
            <p className="font-body-md text-body-md text-outline">
              Recibí alertas instantáneas de reposición de placas de video, drops
              exclusivos y guías de optimización.
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubmit}
            className="w-full max-w-md flex flex-col sm:flex-row items-center gap-2 z-10"
          >
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                mail
              </span>
              <input
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-sm font-body-sm pl-11 pr-4 py-3.5 rounded border border-outline-variant/60 outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all shadow-inner"
                placeholder="Ingresá tu correo electrónico..."
                required
                type="email"
              />
            </div>
            <button
              className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded bg-vermilion hover:bg-vermilion-dark text-white font-label-lg text-label-lg uppercase tracking-wider transition-all border border-secondary/30 shadow-vermilion-sm"
              type="submit"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
