import React from 'react';

export default function ErrorMessage({
  title = 'Ocurrió un inconveniente en el santuario',
  message = 'No pudimos cargar la información solicitada. Por favor, intentá nuevamente.',
  onRetry = null,
}) {
  return (
    <div className="rounded bg-secondary-container/25 border border-vermilion/60 p-space-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md text-on-surface">
      <div className="flex items-start gap-space-md">
        <div className="w-10 h-10 rounded bg-secondary-container/60 border border-vermilion flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-secondary text-[22px]">
            error
          </span>
        </div>
        <div>
          <h4 className="font-headline-sm text-[17px] text-on-surface-bright font-semibold">
            {title}
          </h4>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded bg-surface-container-low hover:bg-surface-container-high border border-primary-container/50 text-primary font-label-md text-label-md uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Reintentar</span>
        </button>
      )}
    </div>
  );
}
