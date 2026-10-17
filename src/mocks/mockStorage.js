import { INITIAL_CATEGORIAS } from './categoriasMock';
import { INITIAL_MARCAS } from './marcasMock';
import { INITIAL_PRODUCTOS } from './productosMock';
import { INITIAL_USUARIOS } from './usuariosMock';
import { INITIAL_PEDIDOS } from './pedidosMock';

const KEYS = {
  PRODUCTOS: 'yokai_mock_productos_v1',
  CATEGORIAS: 'yokai_mock_categorias_v1',
  MARCAS: 'yokai_mock_marcas_v1',
  USUARIOS: 'yokai_mock_usuarios_v1',
  PEDIDOS: 'yokai_mock_pedidos_v1',
  CARRITO_SERVER: 'yokai_mock_carrito_server_v1',
};

/**
 * Simula una pequeña latencia de red para poder apreciar los estados de carga (skeletons/spinners)
 */
export function delay(ms = 240) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readOrSeed(key, seedData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seedData));
      return structuredClone(seedData);
    }
    return JSON.parse(raw);
  } catch {
    return structuredClone(seedData);
  }
}

function writeData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error guardando en mockStorage:', err);
  }
}

export const mockStorage = {
  getProductos: () => readOrSeed(KEYS.PRODUCTOS, INITIAL_PRODUCTOS),
  saveProductos: (items) => writeData(KEYS.PRODUCTOS, items),

  getCategorias: () => readOrSeed(KEYS.CATEGORIAS, INITIAL_CATEGORIAS),
  saveCategorias: (items) => writeData(KEYS.CATEGORIAS, items),

  getMarcas: () => readOrSeed(KEYS.MARCAS, INITIAL_MARCAS),
  saveMarcas: (items) => writeData(KEYS.MARCAS, items),

  getUsuarios: () => readOrSeed(KEYS.USUARIOS, INITIAL_USUARIOS),
  saveUsuarios: (items) => writeData(KEYS.USUARIOS, items),

  getPedidos: () => readOrSeed(KEYS.PEDIDOS, INITIAL_PEDIDOS),
  savePedidos: (items) => writeData(KEYS.PEDIDOS, items),

  getServerCart: (userId) => {
    const allCarts = readOrSeed(KEYS.CARRITO_SERVER, {});
    return allCarts[String(userId)] || [];
  },
  saveServerCart: (userId, cartItems) => {
    const allCarts = readOrSeed(KEYS.CARRITO_SERVER, {});
    allCarts[String(userId)] = cartItems;
    writeData(KEYS.CARRITO_SERVER, allCarts);
  },
};
