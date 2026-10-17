import React from 'react';
import { Link } from 'react-router-dom';

const ACCENT_STYLES = {
  gold: {
    cardHover: 'hover:border-primary-container/70 hover:shadow-gold-glow',
    kanjiHover: 'group-hover:text-primary/50',
    iconBoxHover: 'group-hover:border-primary-container/80 group-hover:bg-primary-container/20',
    iconText: 'text-primary',
    label: 'text-primary',
    chevron: 'text-primary',
  },
  vermilion: {
    cardHover: 'hover:border-vermilion/70 hover:shadow-[0_12px_30px_rgba(200,62,45,0.2)]',
    kanjiHover: 'group-hover:text-secondary/50',
    iconBoxHover: 'group-hover:border-vermilion/80 group-hover:bg-vermilion/20',
    iconText: 'text-secondary',
    label: 'text-secondary',
    chevron: 'text-secondary',
  },
  pine: {
    cardHover: 'hover:border-pine/80 hover:shadow-pine-glow',
    kanjiHover: 'group-hover:text-tertiary/50',
    iconBoxHover: 'group-hover:border-pine group-hover:bg-pine/30',
    iconText: 'text-tertiary',
    label: 'text-tertiary',
    chevron: 'text-tertiary',
  },
};

export default function CategoryCard({ categoria }) {
  const accent = ACCENT_STYLES[categoria.acento] || ACCENT_STYLES.gold;

  return (
    <Link
      to={`/catalogo?categoria=${encodeURIComponent(categoria.nombre)}`}
      className={`group relative flex flex-col justify-between p-space-md rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 transition-all shadow-md ${accent.cardHover}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-display-lg text-display-lg text-outline-variant/40 transition-colors select-none font-serif ${accent.kanjiHover}`}
        >
          {categoria.kanji}
        </span>
        <div
          className={`w-10 h-10 rounded bg-surface-container-high border border-outline-variant/60 flex items-center justify-center transition-colors ${accent.iconBoxHover}`}
        >
          <span className={`material-symbols-outlined text-[20px] ${accent.iconText}`}>
            {categoria.icono || 'memory'}
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-0.5">
        <span
          className={`font-label-sm text-label-sm uppercase tracking-widest font-semibold ${accent.label}`}
        >
          {categoria.nombre}
        </span>
        <h3 className="font-headline-sm text-[16px] text-on-surface-bright font-semibold">
          {categoria.subtitulo}
        </h3>
        <p className="font-body-sm text-body-sm text-outline mt-1 line-clamp-2">
          {categoria.descripcion}
        </p>
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-outline-variant/40 font-label-sm text-label-sm text-on-surface-variant">
          <span>{categoria.modelosCount || categoria.stockModelos || 12} modelos</span>
          <span
            className={`material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform ${accent.chevron}`}
          >
            chevron_right
          </span>
        </div>
      </div>
    </Link>
  );
}
