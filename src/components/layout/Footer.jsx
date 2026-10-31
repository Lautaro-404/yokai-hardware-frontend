import React from 'react';
import { Link } from 'react-router-dom';
import { STORE_LOGO_URL } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest text-on-surface-variant relative border-t border-outline-variant/50">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary-container/50 to-transparent" />
      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-xl">
          {/* Columna 1: Identidad Yokai */}
          <div className="flex flex-col gap-space-md">
            <Link to="/" className="flex items-center gap-space-sm">
              <img
                alt="Yokai Hardware Kitsune Logo"
                className="h-8 w-auto object-contain drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
                src={STORE_LOGO_URL}
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface-bright">
                  Yokai
                </span>
                <span className="font-label-sm text-label-sm text-outline tracking-widest">
                  妖怪 • LEGENDARY TECH
                </span>
              </div>
            </Link>
            <p className="font-body-sm text-body-sm text-outline leading-relaxed">
              Hardware con espíritu legendario. Ensamblados y componentes premium
              diseñados para creadores, gamers competitivos y entusiastas del
              overclocking.
            </p>
            <div className="flex items-center gap-space-sm mt-space-xs">
              <a
                href="#comunidad"
                onClick={(e) => e.preventDefault()}
                aria-label="Instagram Yokai Hardware"
                className="w-9 h-9 rounded bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-outline hover:text-on-surface-bright hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">tag</span>
              </a>
              <a
                href="#comunidad"
                onClick={(e) => e.preventDefault()}
                aria-label="Discord Yokai Hardware"
                className="w-9 h-9 rounded bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-outline hover:text-on-surface-bright hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">forum</span>
              </a>
              <a
                href="#comunidad"
                onClick={(e) => e.preventDefault()}
                aria-label="YouTube Yokai Hardware"
                className="w-9 h-9 rounded bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-outline hover:text-on-surface-bright hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
              </a>
              <a
                href="#comunidad"
                onClick={(e) => e.preventDefault()}
                aria-label="Comunidad Yokai Hardware"
                className="w-9 h-9 rounded bg-surface-container-low border border-outline-variant/60 flex items-center justify-center text-outline hover:text-on-surface-bright hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">public</span>
              </a>
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <div className="flex flex-col gap-space-md">
            <h4 className="font-headline-sm text-[17px] text-on-surface-bright flex items-center gap-space-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Navegación
            </h4>
            <ul className="flex flex-col gap-space-sm font-body-sm text-body-sm">
              <li>
                <Link
                  to="/catalogo"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogo?categoria=Oni"
                  className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2"
                >
                  Ofertas Especiales{' '}
                  <span className="font-label-sm text-label-sm bg-vermilion text-white px-1.5 py-0.5 rounded">
                    HOT
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/carrito"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Mi Carrito de Compras
                </Link>
              </li>
              <li>
                <Link
                  to="/pedidos"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Historial de Pedidos y RMA
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Acceso al Santuario (Mi Cuenta)
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Categorías Yokai */}
          <div className="flex flex-col gap-space-md">
            <h4 className="font-headline-sm text-[17px] text-on-surface-bright flex items-center gap-space-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-pine" />
              Categorías Yokai
            </h4>
            <ul className="flex flex-col gap-space-sm font-body-sm text-body-sm">
              <li>
                <Link
                  to="/catalogo?categoria=Kitsune"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Kitsune CPUs (Procesadores)
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogo?categoria=Oni"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Oni GPUs (Placas de Video)
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogo?categoria=Tengu"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Tengu RAM (Memorias DDR5)
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogo?categoria=Tanuki"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Tanuki SSDs (NVMe Gen4/Gen5)
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogo?categoria=Kappa"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Kappa PSUs (Fuentes Certificadas)
                </Link>
              </li>
              <li>
                <Link
                  to="/catalogo?categoria=Yurei"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Yurei Gabinetes (Chasis Custom)
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Atención y Contacto */}
          <div className="flex flex-col gap-space-md">
            <h4 className="font-headline-sm text-[17px] text-on-surface-bright flex items-center gap-space-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
              Atención y Contacto
            </h4>
            <div className="flex flex-col gap-space-sm font-body-sm text-body-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[18px]">
                  mail
                </span>
                <span className="text-on-surface">info@yokaihardware.com.ar</span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[18px]">
                  call
                </span>
                <span className="text-on-surface">+54 9 11 4589-2233</span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[18px]">
                  location_on
                </span>
                <span className="text-outline">CABA &amp; Mendoza, República Argentina</span>
              </div>
            </div>
            <div className="mt-space-sm p-space-sm rounded bg-surface-container-low border border-outline-variant/40 flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-primary uppercase font-semibold">
                Medios de Pago &amp; Envíos
              </span>
              <p className="font-body-sm text-body-sm text-outline">
                Hasta 12 cuotas sin interés con Mercado Pago y tarjetas bancarias.
                Envíos relámpago con Andreani y Correo Argentino.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-space-lg border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <p className="font-body-sm text-body-sm text-outline text-center sm:text-left">
            © 2026 Yokai Hardware. Todos los derechos reservados. Industria Argentina.
          </p>
          <div className="flex items-center gap-space-md font-body-sm text-body-sm text-outline">
            <Link to="/catalogo" className="hover:text-on-surface-bright transition-colors">
              Términos de Servicio
            </Link>
            <Link to="/catalogo" className="hover:text-on-surface-bright transition-colors">
              Privacidad
            </Link>
            <Link to="/catalogo" className="hover:text-on-surface-bright transition-colors">
              Defensa al Consumidor
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
