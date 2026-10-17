import apiClient, { USE_MOCKS } from './client';
import { mockStorage, delay } from '../mocks/mockStorage';

function generateMockJwt(usuario) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: usuario.email,
      id: usuario.id,
      rol: usuario.rol,
      iat: Date.now(),
    })
  );
  return `${header}.${payload}.yokai-mock-signature`;
}

/**
 * POST /api/auth/login -> { token, usuario: { id, nombre, email, rol } }
 */
export async function loginUsuario({ email, password }) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    return data;
  }

  await delay(300);
  const usuarios = mockStorage.getUsuarios();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const found = usuarios.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!found) {
    const error = new Error('Credenciales inválidas. Verificá tu correo y contraseña.');
    error.status = 401;
    throw error;
  }

  const usuarioPublico = {
    id: found.id,
    nombre: found.nombre,
    email: found.email,
    rol: found.rol,
    direccion: found.direccion || '',
  };

  return {
    token: generateMockJwt(usuarioPublico),
    usuario: usuarioPublico,
  };
}

/**
 * POST /api/auth/registro -> { token, usuario: { id, nombre, email, rol } }
 */
export async function registrarUsuario({ nombre, email, password, direccion = '' }) {
  if (!USE_MOCKS) {
    const { data } = await apiClient.post('/api/auth/registro', {
      nombre,
      email,
      password,
      direccion,
    });
    return data;
  }

  await delay(350);
  const usuarios = mockStorage.getUsuarios();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (usuarios.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    const error = new Error('Ya existe una cuenta registrada con ese correo electrónico.');
    error.status = 409;
    throw error;
  }

  const nuevoId = usuarios.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
  const nuevoUsuario = {
    id: nuevoId,
    nombre: String(nombre).trim(),
    email: normalizedEmail,
    password,
    rol: 'CLIENTE',
    direccion: String(direccion || '').trim(),
  };

  usuarios.push(nuevoUsuario);
  mockStorage.saveUsuarios(usuarios);

  const usuarioPublico = {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    email: nuevoUsuario.email,
    rol: nuevoUsuario.rol,
    direccion: nuevoUsuario.direccion,
  };

  return {
    token: generateMockJwt(usuarioPublico),
    usuario: usuarioPublico,
  };
}
