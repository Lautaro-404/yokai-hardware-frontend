import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginUsuario, registrarUsuario } from '../api/auth';
import { clearSession, restoreSession, saveSession } from '../utils/session';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const SESSION_EXPIRED_MESSAGE =
  'Tu sesión expiró. Iniciá sesión nuevamente para continuar.';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => restoreSession());
  const [loadingAuth, setLoadingAuth] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const { token, usuario } = session;

  // Referencias para que el listener de 401 siempre vea los valores actuales
  const hadSessionRef = useRef(Boolean(token));
  const locationRef = useRef(location);
  hadSessionRef.current = Boolean(token);
  locationRef.current = location;

  const logout = useCallback(() => {
    clearSession();
    setSession({ token: null, usuario: null });
  }, []);

  // El interceptor de la capa API dispara este evento ante un 401 con sesión activa
  useEffect(() => {
    const handleUnauthorized = () => {
      if (!hadSessionRef.current) return;
      logout();
      showToast(SESSION_EXPIRED_MESSAGE, 'warning');
      navigate('/login', {
        replace: true,
        state: { from: locationRef.current, reason: SESSION_EXPIRED_MESSAGE },
      });
    };
    window.addEventListener('yokai:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('yokai:unauthorized', handleUnauthorized);
  }, [logout, navigate, showToast]);

  const startSession = useCallback((res) => {
    const basicUser = saveSession(res);
    setSession({ token: res.token, usuario: basicUser });
    return basicUser;
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      setLoadingAuth(true);
      try {
        const res = await loginUsuario({ email: email.trim(), password });
        return startSession(res);
      } finally {
        setLoadingAuth(false);
      }
    },
    [startSession]
  );

  const registro = useCallback(
    async ({ nombre, email, password, direccion }) => {
      setLoadingAuth(true);
      try {
        const res = await registrarUsuario({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          direccion: direccion?.trim() || '',
        });
        return startSession(res);
      } finally {
        setLoadingAuth(false);
      }
    },
    [startSession]
  );

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
