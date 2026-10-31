import React, { useEffect, useState } from 'react';
import { getHealth } from '../../api/health';
import { NETWORK_ERROR_MESSAGE } from '../../api/client';

/**
 * Aviso general cuando falla la conexión con el servidor. No bloquea la navegación:
 * se oculta solo cuando una petición vuelve a funcionar o al reintentar con éxito.
 */
export default function ConnectionBanner() {
  const [offline, setOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleDown = () => setOffline(true);
    const handleUp = () => setOffline(false);
    window.addEventListener('yokai:network-error', handleDown);
    window.addEventListener('yokai:network-ok', handleUp);
    return () => {
      window.removeEventListener('yokai:network-error', handleDown);
      window.removeEventListener('yokai:network-ok', handleUp);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await getHealth();
    } catch {
      // El interceptor mantiene el aviso visible si el servidor sigue sin responder.
    } finally {
      setRetrying(false);
    }
  };

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="fixed top-20 inset-x-0 z-40 px-gutter pointer-events-none"
    >
      <div className="pointer-events-auto max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded bg-surface-container-low/95 border border-vermilion text-secondary shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-vermilion">cloud_off</span>
          <span className="font-body-sm text-body-sm">{NETWORK_ERROR_MESSAGE}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-primary-container/50 text-primary font-label-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? 'Reintentando...' : 'Reintentar'}
          </button>
          <button
            type="button"
            onClick={() => setOffline(false)}
            aria-label="Cerrar aviso de conexión"
            className="text-outline hover:text-on-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
