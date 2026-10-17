import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client';
import { loginUsuario, registrarUsuario } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || null);
  const [usuario, setUsuario] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loadingAuth, setLoadingAuth] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  // Escucha el evento disparado por el interceptor de Axios ante un HTTP 401
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('yokai:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('yokai:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = useCallback(async ({ email, password }) => {
    setLoadingAuth(true);
    try {
      const res = await loginUsuario({ email, password });
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.usuario));
      setToken(res.token);
      setUsuario(res.usuario);
      return res.usuario;
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const registro = useCallback(async ({ nombre, email, password, direccion }) => {
    setLoadingAuth(true);
    try {
      const res = await registrarUsuario({ nombre, email, password, direccion });
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.usuario));
      setToken(res.token);
      setUsuario(res.usuario);
      return res.usuario;
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const isAuthenticated = Boolean(token && usuario);
  const isAdmin = Boolean(isAuthenticated && usuario?.rol === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        token,
        usuario,
        loadingAuth,
        isAuthenticated,
        isAdmin,
        login,
        registro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
}
