import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatARS } from '../../utils/formatters';
import { STORE_LOGO_URL } from '../../utils/constants';

export default function Header() {
  const { totalItems, subtotal } = useCart();
  const { isAuthenticated, isAdmin, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/catalogo?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/catalogo');
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/40 shadow-header">
      <div className="h-20 w-full max-w-[1440px] mx-auto px-gutter flex items-center justify-between gap-space-lg">
        {/* Brand Logo */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link className="flex items-center gap-space-sm group" to="/">
            <img
              alt="Yokai Hardware Kitsune Logo"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
              src={STORE_LOGO_URL}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface-bright">
                  Yokai
                </span>
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-primary">
                  Hardware
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline tracking-widest">
                妖怪 • KINPAKU &amp; SUMI HARDWARE
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Search Bar */}
        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-outline select-none text-[20px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm font-body-sm pl-12 pr-9 py-3 rounded border border-outline-variant/60 focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:bg-surface-container outline-none transition-all shadow-inner"
              placeholder="Buscá procesadores, placas de video, memorias..."
              type="text"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (location.pathname === '/catalogo') navigate('/catalogo');
                }}
                className="absolute right-3 text-outline hover:text-on-surface-bright"
                aria-label="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </form>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-space-lg shrink-0">
          <nav className="hidden lg:flex items-center gap-space-sm">
            <NavLink
              to="/catalogo"
              className={({ isActive }) =>
                `font-label-lg text-label-lg px-3 py-2 rounded transition-colors ${
                  isActive && !location.search.includes('categoria=Oni')
                    ? 'bg-primary-container text-on-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface-bright'
                }`
              }
            >
              Catálogo
            </NavLink>

            <div className="relative flex items-center">
              <Link
                to="/catalogo?categoria=Oni"
                className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface-bright px-3 py-2 rounded transition-colors"
              >
                Ofertas
              </Link>
              <span className=" -top-1 -right-2 absolute bg-vermilion text-white font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase shadow-[0_0_10px_rgba(200,62,45,0.7)] animate-pulse pointer-events-none">
                Hot
              </span>
            </div>

            {isAuthenticated && (
              <NavLink
                to="/pedidos"
                className={({ isActive }) =>
                  `font-label-lg text-label-lg px-3 py-2 rounded transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary font-bold'
                      : 'text-on-surface-variant hover:text-on-surface-bright'
                  }`
                }
              >
                Mis Pedidos
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `font-label-lg text-label-lg px-3 py-2 rounded transition-colors flex items-center gap-1 ${
                    isActive
                      ? 'bg-vermilion text-white font-bold shadow-vermilion-sm'
                      : 'text-primary hover:text-primary-fixed border border-primary-container/40 bg-surface-container-low'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[16px]">
                  shield_person
                </span>
                <span>Admin</span>
              </NavLink>
            )}

            {!isAuthenticated && (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `font-label-lg text-label-lg px-3 py-2 rounded transition-colors ${
                      isActive
                        ? 'bg-primary-container text-on-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface-bright'
                    }`
                  }
                >
                  Iniciar sesión
                </NavLink>
                <NavLink
                  to="/registro"
                  className={({ isActive }) =>
                    `font-label-lg text-label-lg px-3 py-2 rounded transition-colors border ${
                      isActive
                        ? 'bg-vermilion text-white font-bold border-secondary/30'
                        : 'text-primary border-primary-container/40 hover:text-primary-fixed'
                    }`
                  }
                >
                  Registrarse
                </NavLink>
              </>
            )}
          </nav>

          <div className="h-6 w-px bg-outline-variant/60 hidden lg:block" />

          {/* Cart & User Controls */}
          <div className="flex items-center gap-space-md">
            <Link
              to="/carrito"
              className="flex items-center gap-space-sm bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/50 px-space-md py-2 rounded transition-all group"
            >
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-primary group-hover:text-primary-fixed transition-colors text-[24px]">
                  shopping_bag
                </span>
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-vermilion text-white rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold shadow-[0_0_8px_rgba(200,62,45,0.7)]">
                  {totalItems}
                </span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-label-sm text-label-sm text-outline uppercase">
                  Carrito
                </span>
                <span className="font-label-md text-label-md text-on-surface-bright font-bold">
                  {formatARS(subtotal)}
                </span>
              </div>
            </Link>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to={isAdmin ? '/admin' : '/pedidos'}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface-container-low border border-primary-container/40 hover:border-primary transition-colors"
                  title={`Sesión iniciada como ${usuario.nombre} (${usuario.rol})`}
                >
                  <div className="w-7 h-7 rounded bg-primary-container flex items-center justify-center shadow-md border border-primary-fixed/40">
                    <span className="material-symbols-outlined text-on-primary text-[17px]">
                      person
                    </span>
                  </div>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="font-label-sm text-label-sm text-primary uppercase leading-none">
                      {usuario.rol}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-bright truncate max-w-[110px]">
                      {usuario.nombre.split(' ')[0]}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  className="w-9 h-9 rounded bg-surface-container-low hover:bg-secondary-container/40 border border-outline-variant/50 hover:border-vermilion text-outline hover:text-secondary flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                title="Iniciar sesión"
                className="w-9 h-9 rounded bg-primary-container hover:bg-primary flex items-center justify-center shadow-md border border-primary-fixed/40 transition-colors"
              >
                <span className="material-symbols-outlined text-on-primary text-[18px]">
                  person
                </span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden w-9 h-9 rounded bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-on-surface-bright"
              aria-label="Abrir menú"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest/98 border-b border-outline-variant/60 px-gutter py-space-md flex flex-col gap-space-md backdrop-blur-xl">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm font-body-sm pl-11 pr-4 py-2.5 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
              placeholder="Buscá procesadores, placas de video..."
              type="text"
            />
          </form>

          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              className="px-3 py-2 rounded font-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface-bright"
            >
              Inicio
            </Link>
            <Link
              to="/catalogo"
              className="px-3 py-2 rounded font-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface-bright"
            >
              Catálogo Completo
            </Link>
            <Link
              to="/catalogo?categoria=Oni"
              className="px-3 py-2 rounded font-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface-bright flex items-center justify-between"
            >
              <span>Ofertas Oni Edition</span>
              <span className="bg-vermilion text-white font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase">
                Hot
              </span>
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/pedidos"
                  className="px-3 py-2 rounded font-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface-bright"
                >
                  Mis Pedidos
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded font-label-lg text-primary hover:bg-surface-container-low flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      shield_person
                    </span>
                    <span>Panel de Administración</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="mt-2 px-3 py-2 rounded bg-secondary-container/30 border border-vermilion/40 text-secondary font-label-lg text-left flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Cerrar sesión ({usuario.nombre})</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  className="py-2.5 rounded bg-surface-container-low border border-primary-container/50 text-primary text-center font-label-lg uppercase"
                >
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  className="py-2.5 rounded bg-vermilion text-white text-center font-label-lg uppercase"
                >
                  Crear Cuenta
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
