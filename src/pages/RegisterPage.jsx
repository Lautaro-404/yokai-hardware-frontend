import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { registro, loadingAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    direccion: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.nombre.trim() || formData.nombre.trim().length < 3) {
      errors.nombre = 'Ingresá tu nombre y apellido completo (mín. 3 caracteres).';
    }
    if (!formData.email.trim()) {
      errors.email = 'Ingresá tu correo electrónico.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Ingresá un correo electrónico válido.';
    }
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    try {
      const user = await registro({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        direccion: formData.direccion,
      });
      showToast(`¡Cuenta creada con éxito! Bienvenido, ${user.nombre}.`, 'success');
      navigate('/');
    } catch (err) {
      if (err?.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      }
      setFormError(err?.message || 'No se pudo completar el registro.');
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="w-full max-w-lg p-space-xl rounded bg-surface-container-low border border-primary-container/40 shadow-2xl relative overflow-hidden">
        <span className="pointer-events-none select-none absolute -right-4 -top-6 font-serif text-[130px] text-outline-variant/15 leading-none">
          契
        </span>

        <div className="flex flex-col gap-space-xs mb-space-lg relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-vermilion" />
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
              Nuevo Guerrero Digital
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface-bright">
            Crear Cuenta en Yokai Hardware
          </h1>
          <p className="font-body-sm text-body-sm text-outline">
            Registrate para realizar compras con despacho asegurado y seguir tus pedidos en tiempo real.
          </p>
        </div>

        {formError && (
          <div role="alert" className="mb-space-md p-3 rounded bg-secondary-container/30 border border-vermilion text-secondary font-body-sm text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-md relative z-10">
          <div>
            <label
              htmlFor="reg-nombre"
              className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5"
            >
              Nombre y Apellido
            </label>
            <input
              id="reg-nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Lucas Fernández"
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-3.5 py-3 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
            />
            {fieldErrors.nombre && (
              <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                {fieldErrors.nombre}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5"
            >
              Correo Electrónico
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="lucas@ejemplo.com.ar"
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-3.5 py-3 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
            />
            {fieldErrors.email && (
              <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-direccion"
              className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5"
            >
              Dirección de Envío Predeterminada (Opcional)
            </label>
            <input
              id="reg-direccion"
              name="direccion"
              type="text"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Av. Mitre 1420, San Rafael, Mendoza"
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-3.5 py-3 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div>
              <label
                htmlFor="reg-password"
                className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-3.5 py-3 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
              />
              {fieldErrors.password && (
                <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1.5"
              >
                Repetir Contraseña
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline/60 text-body-sm px-3.5 py-3 rounded border border-outline-variant/60 focus:border-primary-container outline-none"
              />
              {fieldErrors.confirmPassword && (
                <span className="font-label-sm text-label-sm text-secondary mt-1 block">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingAuth}
            className="w-full mt-2 py-3.5 px-6 rounded bg-vermilion hover:bg-vermilion-dark disabled:opacity-50 text-white font-label-lg text-label-lg uppercase tracking-wider transition-all border border-secondary/30 shadow-vermilion-glow flex items-center justify-center gap-2"
          >
            <span>{loadingAuth ? 'Creando cuenta...' : 'Registrarme'}</span>
            <span className="material-symbols-outlined text-[18px]">person_add</span>
          </button>
        </form>

        <div className="mt-space-lg pt-space-md border-t border-outline-variant/40 text-center font-body-sm text-body-sm text-outline relative z-10">
          ¿Ya tenés una cuenta registrada?{' '}
          <Link
            to="/login"
            className="text-primary hover:text-primary-fixed font-semibold"
          >
            Iniciá sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
