# 妖怪 Yokai Hardware — Frontend E-Commerce

Frontend funcional para el e-commerce de componentes de hardware con temática Yokai (**Kinpaku & Sumi**), desarrollado a partir del sistema de diseño exportado desde Google Stitch (`/design`).

Consume la API REST del backend en **Java + Spring Boot (JWT + PostgreSQL)**; la URL se configura con la variable de entorno `VITE_API_URL`. No incluye datos simulados.

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

| Variable | Obligatoria | Descripción | Local | Producción |
| --- | --- | --- | --- | --- |
| `VITE_API_URL` | Sí | URL pública de la API REST, sin barra final | `http://localhost:8080` | `URL_DEPLOY_API` (por ejemplo `https://TU-BACKEND.ejemplo.com`) |

`VITE_API_URL` se incrusta en el bundle **al compilar**: si la cambiás en Vercel, hay que volver a desplegar. No guardes secretos en variables `VITE_*`: quedan visibles en el navegador. Las variables del backend están en [`server/.env.example`](./server/.env.example).

---

## 🌐 Despliegue en Vercel

El archivo [`vercel.json`](./vercel.json) ya define el build (`npm run build`, salida `dist`) y el fallback a `index.html` para que las rutas internas (`/catalogo`, `/producto/3`, `/pedidos`) funcionen al recargar.

**Desde el panel web:**
1. En [vercel.com/new](https://vercel.com/new), importá el repositorio. Vercel detecta Vite.
2. En *Settings → Environment Variables*, creá `VITE_API_URL` con la URL pública del backend (entorno *Production*).
3. Desplegá. URL pública: `URL_DEPLOY_FRONTEND` (completar al desplegar).

**Desde la terminal:**
```bash
npm install -g vercel
vercel login
vercel link
vercel env add VITE_API_URL production   # pegá la URL pública de la API
vercel --prod
```

**Verificación después del deploy:**
1. Abrí `/catalogo` y recargá con F5: no debe dar 404.
2. En DevTools → Network, comprobá que las peticiones van a la URL de la API y que no hay errores de CORS.
3. Probá el flujo completo: registro → catálogo → carrito → checkout → pedido en `/pedidos` y en el panel de administración.

### Ajustes del backend para producción
El backend no se modifica desde este repositorio de frontend, pero para que funcione con el frontend desplegado hay que configurar:

1. **CORS:** `CORS_ALLOWED_ORIGINS=https://TU-FRONTEND.vercel.app` (varios orígenes separados por coma, con el esquema exacto y sin barra final). Las URLs de preview de Vercel cambian en cada deploy y hoy el código no admite patrones, así que habría que agregarlas una por una.
2. **Perfil:** `SPRING_PROFILES_ACTIVE=prod`. Por defecto arranca `dev` (`show-sql` activo y Flyway `clean` habilitado).
3. **Variables obligatorias:** `DB_URL` (con `sslmode=require`), `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (mínimo 32 caracteres, nuevo y secreto) y `PORT` (lo inyecta el hosting).
4. **Secreto JWT por defecto:** `application.yml` tiene un valor por defecto escrito en el repositorio. Conviene eliminarlo para que nunca se use en producción.
5. **Flyway:** las ubicaciones (`filesystem:db/migration`, `../db/seed`) dependen de rutas del sistema de archivos. En un contenedor hay que copiar `db/` junto al JAR o pasarlas a `classpath:`, y confirmar si el seed debe correr en producción.
6. **Build y hosting del backend:** `server/` no tiene `Dockerfile` ni `Procfile`. Render, Railway o Fly.io necesitan uno de ellos o un comando de build (`./mvnw -f server/pom.xml clean package`).
7. **HTTPS:** la API tiene que servirse por `https://`. Si no, el navegador bloquea las peticiones del frontend por contenido mixto.
8. **Swagger:** `/swagger-ui/**` y `/v3/api-docs/**` son públicos; valorar restringirlos en producción.
9. **Arranque en frío:** en planes gratuitos el backend se duerme y la primera petición puede superar el timeout de 15 s del cliente.
10. **Usuario `ADMIN`:** definir cómo se crea en producción (seed o manual) para poder probar el panel.

---

## 🔌 Conexión con la API

Toda la comunicación pasa por la capa `/src/api` (`auth.js`, `productos.js`, `categorias.js`, `marcas.js`, `carrito.js`, `pedidos.js`, `admin.js`). Ante un error del servidor se muestra un mensaje en español con opción de reintento, y si falla la conexión aparece un aviso general sin bloquear la navegación.

---

## 🗺️ Pantallas y Rutas

- `/` : **Inicio** (Hero *Oni Edition*, 6 Categorías Yokai, Productos Destacados con filtro rápido, Beneficios).
- `/catalogo` : **Catálogo completo** con búsqueda por texto, filtros por categoría Yokai, marca y rango de precio en ARS, ordenamiento y paginación sincronizados con la URL (`query params`).
- `/producto/:id` : **Detalle de producto** con galería de vistas, indicador de stock, selector de cantidad validado contra stock, botón *Agregar al carrito*, pestañas de *Especificaciones Técnicas* y *Descripción*, y productos relacionados.
- `/carrito` : **Carrito de compras** persistente en `localStorage` (y sincronizado al iniciar sesión), ajuste de cantidades con límite de stock y resumen financiero.
- `/checkout` : *(Ruta protegida)* Formulario validado de datos de envío en Argentina, selección de medio de pago, resumen y confirmación de orden con descuento automático de stock.
- `/pedidos` : *(Ruta protegida)* Historial de pedidos del usuario con su estado actual y desglose de componentes.
- `/login` y `/registro` : Formularios de autenticación con validación de campos.
- `/admin` : *(Ruta protegida exclusiva rol `ADMIN`)* Panel con sidebar para **Productos** (ABM), **Categorías** (ABM), **Control de Stock** (edición rápida) y **Pedidos** (cambio de estado).

---

## ☕ Backend (Spring Boot + PostgreSQL)

### Ejecución en Local
```bash
# Levantar el backend con Maven Wrapper
.\mvnw.cmd -f server\pom.xml spring-boot:run

# Correr la suite de pruebas unitarias y de integración
.\mvnw.cmd -f server\pom.xml test
```

### Documentación Swagger / OpenAPI
Una vez levantado el servidor backend (`http://localhost:8080`), la documentación interactiva OpenAPI v3 con esquema de autenticación Bearer JWT está disponible en:
- **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Colección de Postman
La colección completa con todos los flujos de prueba (registro, login, catálogo facetado, carrito, pedidos y panel de administración con verificación de estados) se encuentra en:
- [`/docs/yokai_hardware_api.postman_collection.json`](./docs/yokai_hardware_api.postman_collection.json)
Para importarla en Postman: `Import` -> `File` -> seleccionar el archivo en `/docs`. Incluye tests automatizados en cada petición y variables dinámicas.
