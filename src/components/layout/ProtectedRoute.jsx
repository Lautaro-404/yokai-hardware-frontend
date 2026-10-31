import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../ui/EmptyState';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          reason: 'Iniciá sesión para acceder a esta sección.',
        }}
        replace
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-xl">
        <EmptyState
          kanji="禁"
          icon="lock"
          title="Acceso denegado (403)"
          description="No tenés permisos para ver esta sección. El panel de administración es exclusivo para cuentas con rol ADMIN."
          actionLabel="Volver al inicio"
          actionTo="/"
        />
      </div>
    );
  }

  return children;
}
