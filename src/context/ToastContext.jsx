import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded border backdrop-blur-xl shadow-2xl transition-all ${
                isError
                  ? 'bg-surface-container-low/95 border-vermilion text-secondary'
                  : isWarning
                  ? 'bg-surface-container-low/95 border-primary-container text-primary'
                  : 'bg-surface-container-low/95 border-primary-container/70 text-on-surface-bright'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isError
                      ? 'text-vermilion'
                      : isWarning
                      ? 'text-primary'
                      : 'text-primary'
                  }`}
                >
                  {isError ? 'error' : isWarning ? 'warning' : 'check_circle'}
                </span>
                <span className="font-body-sm text-body-sm">{toast.message}</span>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-outline hover:text-on-surface-bright transition-colors"
                aria-label="Cerrar notificación"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe utilizarse dentro de un ToastProvider');
  }
  return ctx;
}
