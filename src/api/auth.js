import apiClient from './client';

/**
 * POST /api/auth/login -> { token, usuario: { id, nombre, email, rol, direccion } }
 */
export async function loginUsuario({ email, password }) {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  return data;
}

/**
 * POST /api/auth/register -> { token, usuario: { id, nombre, email, rol, direccion } }
 */
export async function registrarUsuario({ nombre, email, password, direccion = '' }) {
  const { data } = await apiClient.post('/api/auth/register', {
    nombre,
    email,
    password,
    direccion,
  });
  return data;
}
