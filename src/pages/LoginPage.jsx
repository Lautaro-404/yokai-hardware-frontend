import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login, loadingAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/';
  const sessionNotice = location.state?.reason || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  const validate = () => {
    const errors = {};
    const emailTrim = email.trim();
    if (!emailTrim) {
      errors.email = 'Ingresá tu correo electrónico.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errors.email = 'El formato del correo electrónico no es válido.';
    }
    if (!password) {
      errors.password = 'Ingresá tu contraseña.';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    try {
      const user = await login({ email, password });
      showToast(`¡Bienvenido de nuevo, ${user.nombre}!`, 'success');
      if (user.rol === 'ADMIN' && redirectTo === '/') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      }
      setFormError(
        err?.message || 'No se pudo iniciar sesión. Verificá tus credenciales.'
      );
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-gutter py-8 sm:py-space-xl flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="w-full max-w-md p-5 sm:p-space-xl rounded bg-surface-container-low border border-primary-container/40 shadow-2xl relative overflow-hidden">
        <span className="pointer-events-none select-none absolute -right-4 -top-6 font-serif text-[130px] text-outline-variant/15 leading-none">
          門
        </span>

        <div className="flex flex-col gap-space-xs mb-space-lg relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
              Portal del Santuario
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface-bright">
            Iniciar Sesión
          </h1>
          <p className="font-body-sm text-body-sm text-outline">
            Ingresá tus credenciales para gestionar tu carrito, pedidos y garantías.
          </p>
        </div>

        {sessionNotice && !formError && (
          <div
            role="status"
            className="mb-space-md p-3 rounded bg-surface-container-high border border-primary-container/60 text-primary font-body-sm text-body-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{sessionNotice}</span>
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="mb-space-md p-3 rounded bg-secondary-container/30 border border-vermilion text-secondary font-body-sm text-body-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-md relative z-10">
          <div>
            <label
              htmlFor="login-email"
              className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5"
            >
              Correo Electrónico
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com.ar"
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-3.5 py-3 rounded border border-outline-variant/60 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
            />
            {fieldErrors.email && (
              <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-3.5 py-3 rounded border border-outline-variant/60 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all"
            />
            {fieldErrors.password && (
              <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loadingAuth}
            className="w-full min-h-[48px] mt-2 py-3.5 px-6 rounded bg-vermilion hover:bg-vermilion-dark disabled:opacity-50 text-white font-label-lg text-label-lg uppercase tracking-wider transition-all border border-secondary/30 shadow-vermilion-glow flex items-center justify-center gap-2"
          >
            <span>{loadingAuth ? 'Verificando...' : 'Ingresar al Santuario'}</span>
            <span className="material-symbols-outlined text-[18px]">login</span>
          </button>
        </form>

        <div className="mt-space-lg pt-space-md border-t border-outline-variant/40 text-center font-body-sm text-body-sm text-outline relative z-10">
          ¿Todavía no tenés cuenta?{' '}
          <Link
            to="/registro"
            className="text-primary hover:text-primary-fixed font-semibold"
          >
            Registrate acá
          </Link>
        </div>
      </div>
    </div>
  );
}
