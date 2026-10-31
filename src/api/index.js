import apiClient, {
  ApiError,
  normalizeApiError,
  API_BASE_URL,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from './client';
import * as healthApi from './health';
import * as authApi from './auth';
import * as productosApi from './productos';
import * as categoriasApi from './categorias';
import * as marcasApi from './marcas';
import * as carritoApi from './carrito';
import * as pedidosApi from './pedidos';
import * as adminApi from './admin';

export {
  apiClient,
  ApiError,
  normalizeApiError,
  API_BASE_URL,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  healthApi,
  authApi,
  productosApi,
  categoriasApi,
  marcasApi,
  carritoApi,
  pedidosApi,
  adminApi,
};

export * from './health';
export * from './auth';
export * from './productos';
export * from './categorias';
export * from './marcas';
export * from './carrito';
export * from './pedidos';
export * from './admin';
