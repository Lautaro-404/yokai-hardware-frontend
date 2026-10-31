import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'yokai_jwt_token';
export const USER_STORAGE_KEY = 'yokai_auth_user';

export const USE_MOCKS =
  String(import.meta.env.VITE_USE_MOCKS ?? 'false').toLowerCase() === 'true';

export const API_BASE_URL = String(import.meta.env.VITE_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '');

const DEFAULT_STATUS_MESSAGES = {
  400: 'Los datos enviados no son válidos. Revisá los campos e intentá nuevamente.',
  401: 'Tu sesión expiró o las credenciales son inválidas. Iniciá sesión nuevamente.',
  403: 'No tenés permisos suficientes para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'No se pudo completar la operación por un conflicto con el estado actual.',
  500: 'Ocurrió un error interno en el servidor. Intentá nuevamente en unos instantes.',
};

/**
 * Error normalizado de la capa API con mensaje legible en español rioplatense.
 */
export class ApiError extends Error {
  constructor({
    message,
    status = 0,
    details = [],
    fieldErrors = {},
    path = '',
    originalError = null,
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.fieldErrors = fieldErrors;
    this.path = path;
    this.response = originalError?.response;
  }
}

/**
 * Extrae un mapa { campo: mensaje } a partir de la lista details ("campo: mensaje")
 * devuelta por el GlobalExceptionHandler del backend en errores 400.
 */
function parseFieldErrors(details = []) {
  const fieldErrors = {};
  if (!Array.isArray(details)) return fieldErrors;

  for (const item of details) {
    if (typeof item !== 'string') continue;
    const colonIndex = item.indexOf(':');
    if (colonIndex > 0) {
      const field = item.slice(0, colonIndex).trim();
      const msg = item.slice(colonIndex + 1).trim();
      if (field && msg && !fieldErrors[field]) {
        fieldErrors[field] = msg;
      }
    }
  }
  return fieldErrors;
}

/**
 * Convierte cualquier error de Axios o del backend (400, 401, 403, 404, 409, 500 o red)
 * en un ApiError con un mensaje claro en español para el usuario.
 */
export function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  // Error de red, servidor caído, bloqueo CORS o timeout
  if (!error?.response) {
    const isTimeout = error?.code === 'ECONNABORTED';
    return new ApiError({
      message: isTimeout
        ? 'El servidor tardó demasiado en responder. Intentá nuevamente.'
        : 'No se pudo conectar con el servidor. Verificá tu conexión o que el backend esté en ejecución.',
      status: 0,
      originalError: error,
    });
  }

  const { status, data } = error.response;
  const details = Array.isArray(data?.details) ? data.details : [];
  const fieldErrors = parseFieldErrors(details);
  const backendMessage =
    typeof data?.message === 'string' && data.message.trim() !== ''
      ? data.message.trim()
      : '';

  let userMessage = backendMessage || DEFAULT_STATUS_MESSAGES[status] || DEFAULT_STATUS_MESSAGES[500];

  // Si es 400 por validación de campos y hay detalles específicos, mostramos el detalle legible
  if (status === 400 && details.length > 0) {
    const cleanDetails = details
      .map((d) => {
        const idx = typeof d === 'string' ? d.indexOf(':') : -1;
        return idx > 0 ? d.slice(idx + 1).trim() : String(d).trim();
      })
      .filter(Boolean);

    if (
      cleanDetails.length > 0 &&
      (!backendMessage || backendMessage.includes('validaciones requeridas'))
    ) {
      userMessage = cleanDetails.join(' ');
    }
  }

  return new ApiError({
    message: userMessage,
    status,
    details,
    fieldErrors,
    path: data?.path || error?.config?.url || '',
    originalError: error,
  });
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de request: adjunta Authorization: Bearer <token> si existe sesión
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

// Interceptor de response: cierra sesión ante un 401 y centraliza los errores HTTP
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const isAuthAttempt =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/registro');

    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('yokai:unauthorized'));
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export default apiClient;
