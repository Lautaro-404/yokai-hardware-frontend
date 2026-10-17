# 妖怪 Yokai Hardware — Frontend E-Commerce

Frontend funcional para el e-commerce de componentes de hardware con temática Yokai (**Kinpaku & Sumi**), desarrollado a partir del sistema de diseño exportado desde Google Stitch (`/design`).

Preparado para funcionar de inmediato con **datos simulados persistentes** (`VITE_USE_MOCKS=true`) y conectarse al backend en **Java + Spring Boot (JWT + PostgreSQL)** cambiando una única variable de entorno.

---

## 🚀 Stack Tecnológico

- **React 18** + **Vite 5**
- **React Router DOM v6** (Rutas públicas, rutas protegidas de cliente y rutas exclusivas `ADMIN`)
- **Tailwind CSS v3** (Tokens de diseño configurados en [`tailwind.config.js`](./tailwind.config.js))
- **Axios** (Cliente HTTP centralizado con interceptor de request `Authorization: Bearer <token>` e interceptor de response con cierre de sesión automático ante `401 Unauthorized`)
- **Context API nativo** (`AuthContext`, `CartContext` y `ToastContext`)
- **Formato de moneda local:** `Intl.NumberFormat("es-AR")` en Pesos Argentinos (ARS)

---

## 📦 Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copiá el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

4. **Compilar para producción:**
   ```bash
   npm run build
   npm run preview
   ```

---

## ⚙️ Variables de Entorno (`.env.example`)

```env
# URL base del backend en Java + Spring Boot
VITE_API_URL=http://localhost:8080

# Si es true, el frontend utiliza los datos simulados de /src/mocks.
# Cambiar a false para conectarse a la API real de Spring Boot.
VITE_USE_MOCKS=true
```

---

## 🔄 Cómo pasar de Mocks a la API Real (Spring Boot)

Toda la comunicación pasa por la capa `/src/api` (`auth.js`, `productos.js`, `categorias.js`, `marcas.js`, `carrito.js`, `pedidos.js`).

Para dejar de usar los datos simulados de `/src/mocks` y conectarse al backend real en Spring Boot:

1. Abrí el archivo `.env` en la raíz del proyecto.
2. Cambiá `VITE_USE_MOCKS` a `false` y verificá la URL de tu backend en `VITE_API_URL`:
   ```env
   VITE_API_URL=http://localhost:8080
   VITE_USE_MOCKS=false
   ```
3. Reiniciá el servidor de Vite (`npm run dev`).

---

## 🔑 Cuentas de Prueba (Modo `VITE_USE_MOCKS=true`)

En la pantalla `/login` también disponés de botones de acceso rápido con 1 clic:

| Rol | Email | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **CLIENTE** | `cliente@yokaihardware.com.ar` | `cliente123` | Carrito sincronizado, Checkout y Mis Pedidos (`/pedidos`) |
| **ADMIN** | `admin@yokaihardware.com.ar` | `admin123` | Todo lo anterior + Panel de Administración (`/admin`) |

---

## 🗺️ Pantallas y Rutas

- `/` : **Inicio** (Hero *Oni Edition*, 6 Categorías Yokai, Productos Destacados con filtro rápido, Beneficios y Newsletter).
- `/catalogo` : **Catálogo completo** con búsqueda por texto, filtros por categoría Yokai, marca y rango de precio en ARS, ordenamiento y paginación sincronizados con la URL (`query params`).
- `/producto/:id` : **Detalle de producto** con galería de vistas, indicador de stock, selector de cantidad validado contra stock, botón *Agregar al carrito*, pestañas de *Especificaciones Técnicas* y *Descripción*, y productos relacionados.
- `/carrito` : **Carrito de compras** persistente en `localStorage` (y sincronizado al iniciar sesión), ajuste de cantidades con límite de stock y resumen financiero.
- `/checkout` : *(Ruta protegida)* Formulario validado de datos de envío en Argentina, selección de medio de pago, resumen y confirmación de orden con descuento automático de stock.
- `/pedidos` : *(Ruta protegida)* Historial de pedidos del usuario con su estado actual y desglose de componentes.
- `/login` y `/registro` : Formularios de autenticación con validación de campos.
- `/admin` : *(Ruta protegida exclusiva rol `ADMIN`)* Panel con sidebar para **Productos** (ABM), **Categorías** (ABM), **Control de Stock** (edición rápida) y **Pedidos** (cambio de estado).
