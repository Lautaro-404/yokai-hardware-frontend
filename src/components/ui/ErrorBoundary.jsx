import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Captura errores de renderizado para que una pantalla rota nunca deje la app en blanco.
 * Se reinicia al cambiar `resetKey` (por ejemplo, la ruta actual).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <div
          role="alert"
          className="rounded bg-secondary-container/25 border border-vermilion/60 p-space-lg flex flex-col gap-space-md text-on-surface"
        >
          <h2 className="font-headline-sm text-[18px] text-on-surface-bright font-semibold">
            Algo salió mal en esta pantalla
          </h2>
          <p className="font-body-sm text-body-sm text-secondary">
            Ocurrió un problema inesperado. Podés recargar la página o volver al inicio para
            seguir navegando.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-surface-container-low hover:bg-surface-container-high border border-primary-container/50 text-primary font-label-md text-label-md uppercase tracking-wider"
            >
              Recargar página
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-on-surface-variant font-label-md text-label-md uppercase tracking-wider"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
