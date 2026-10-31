import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client';

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Un token vigente es un JWT legible que no superó su claim "exp" (en segundos).
 * Si el token no trae "exp" (modo simulado) se considera vigente.
 */
export function isTokenVigente(token) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (payload.exp === undefined) return true;
  return Number(payload.exp) * 1000 > Date.now();
}

function pickBasicUser(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    direccion: usuario.direccion || '',
  };
}

export function saveSession({ token, usuario }) {
  const basicUser = pickBasicUser(usuario);
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(basicUser));
  return basicUser;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Restaura la sesión guardada. Si falta algún dato, está corrupto o el token
 * venció, limpia el almacenamiento y devuelve una sesión vacía.
 */
export function restoreSession() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  let usuario = null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    usuario = raw ? JSON.parse(raw) : null;
  } catch {
    usuario = null;
  }

  if (!token || !usuario?.rol || !isTokenVigente(token)) {
    clearSession();
    return { token: null, usuario: null };
  }
  return { token, usuario };
}
