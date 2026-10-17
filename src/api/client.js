import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'yokai_jwt_token';
export const USER_STORAGE_KEY = 'yokai_auth_user';

export const USE_MOCKS =
  String(import.meta.env.VITE_USE_MOCKS ?? 'true').toLowerCase() !== 'false';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de request: adjunta Authorization: Bearer <token>
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: cierra sesión automáticamente ante un 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('yokai:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
