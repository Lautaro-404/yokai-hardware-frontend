# 妖怪 Yokai Hardware — E-Commerce de Hardware & Tecnología

Proyecto Integrador de **Programación IV** — **UTN Facultad Regional San Rafael**  
**Grupo:** *Print("Estoy Cansado Jefe")* (10 integrantes)  
**Entrega:** Noviembre 2026

Plataforma e-commerce completa de hardware y computación (procesadores, placas de video, memorias RAM, almacenamiento SSD, fuentes de poder, gabinetes y periféricos) con identidad visual inspirada en el folclore japonés (**Kinpaku & Sumi**). Diseñada con arquitectura en capas desacopladas: frontend SPA reactivo en **React + Vite** y backend RESTful en **Java + Spring Boot** con seguridad **JWT**, persistencia transaccional en **PostgreSQL 15** y migraciones versionadas con **Flyway**.

---

## 🌐 URLs del Despliegue en Producción

| Servicio | Plataforma | URL Pública | Estado |
| :--- | :--- | :--- | :--- |
| **Frontend Web (React SPA)** | Vercel | [https://yokai-hardware-frontend.vercel.app](https://yokai-hardware-frontend.vercel.app) | Operativo (HTTP 200) |
| **Backend REST API** | Render | [https://yokai-hardware-api.onrender.com/api](https://yokai-hardware-api.onrender.com/api) | Operativo |
| **Documentación OpenAPI / Swagger** | Render | [https://yokai-hardware-api.onrender.com/swagger-ui.html](https://yokai-hardware-api.onrender.com/swagger-ui.html) | Operativo (HTTP 200) |
| **API Health Check** | Render | [https://yokai-hardware-api.onrender.com/api/health](https://yokai-hardware-api.onrender.com/api/health) | `{"status":"UP","database":"UP"}` |

> [!NOTE]
> En entorno local, el frontend corre en `http://localhost:5173` y se comunica con la API en `http://localhost:8080`.

---

## 🚀 Stack Tecnológico

### Frontend
- **React 18** + **Vite 5** (Build tool y servidor de desarrollo ultra veloz).
- **React Router DOM v6** (Rutas públicas, rutas protegidas de cliente y rutas exclusivas `ADMIN`).
- **Tailwind CSS v3** (Sistema de diseño temático Kinpaku & Sumi, paleta oscura con acentos oro y bermellón, responsive para móvil, tablet y escritorio).
- **Axios** (Cliente HTTP centralizado en `src/api/client.js` con interceptores para `Authorization: Bearer <token>`, reconexión y logout automático ante `401 Unauthorized`).
- **Context API nativo:**
  - `AuthContext`: Sesión JWT persistente, roles (`CLIENTE`, `ADMIN`), login y registro.
  - `CartContext`: Carrito local y sincronización con base de datos (`/api/carrito`), manejo de concurrencia y stock conflictivo (409).
  - `ToastContext`: Notificaciones de feedback en español rioplatense neutro.
- **Formato monetario oficial:** `Intl.NumberFormat("es-AR")` en Pesos Argentinos (ARS).

### Backend
- **Java 17+** con **Spring Boot 3.2.x**.
- **Spring Web** (API REST con controladores desacoplados de la lógica de negocio).
- **Spring Data JPA / Hibernate** (Mapeo objeto-relacional optimizado, consultas atómicas y batch inserts).
- **Spring Security 6 + JJWT** (Autenticación stateless mediante tokens Bearer JWT y contraseñas hasheadas con BCrypt).
- **Jakarta Bean Validation** (Validación exhaustiva de payloads con `GlobalExceptionHandler` y respuestas uniformes).
- **Flyway** (Migraciones de base de datos versionadas `V1` a `V9` y seeds idempotentes).
- **SpringDoc OpenAPI v3** (Documentación interactiva Swagger UI integrada).

### Base de Datos & DevOps
- **PostgreSQL 15+** (Relacional, integridad referencial con claves foráneas y tipos JSONB para especificaciones técnicas de hardware).
- **Docker & Docker Compose** (Contenedor PostgreSQL oficial para desarrollo local reproducible).
- **Vercel** (Hosting de Frontend con rewrites SPA en `vercel.json`).

---

## 📁 Estructura del Repositorio

El repositorio está organizado como un monorepo limpio:

```text
├── client/                     # Documentación de diseño y pantallas prototipo
├── db/                         # Scripts de base de datos y migraciones Flyway
│   ├── migration/              # Migraciones versionadas DDL (V1__... a V9__...)
│   ├── ops/                    # Aprovisionamiento de roles de seguridad PostgreSQL
│   ├── queries/                # Consultas SQL analíticas clave
│   └── seed/                   # Seeds de referencia y datos de demo (dev)
├── docs/                       # Documentación técnica, arquitectura, Plan de Proyecto y Postman
│   ├── yokai_hardware_api.postman_collection.json # Colección de pruebas automatizadas
│   └── Arquitectura_del_Sistema.html             # Diagramas interactivos
├── server/                     # Backend Java + Spring Boot
│   ├── pom.xml                 # Configuración de dependencias Maven
│   ├── .env.example            # Variables de entorno para el backend
│   └── src/                    # Código fuente (controller, service, repository, entity, dto, config)
├── src/                        # Frontend React + Vite
│   ├── api/                    # Capa centralizada de llamadas HTTP (productos, carrito, pedidos, admin, auth)
│   ├── components/             # Componentes modulares y reutilizables (layout, product, cart, ui)
│   ├── context/                # Contextos de React (AuthContext, CartContext, ToastContext)
│   ├── pages/                  # Pantallas (Home, Catalogo, Detalle, Carrito, Checkout, Pedidos, Login, Registro, Admin)
│   └── utils/                  # Constantes, formateadores de moneda y fecha
├── docker-compose.yml          # Servicio PostgreSQL 15 local
├── Dockerfile                  # Multi-stage build (Maven + Temurin JRE 17) para Render
├── render.yaml                 # Blueprint IaC para Render (Web Service + PostgreSQL)
├── .dockerignore               # Exclusiones de build de contenedor
├── .vercelignore               # Exclusiones de build de frontend
├── mvnw / mvnw.cmd             # Maven Wrapper raíz configurado para server/pom.xml
├── package.json                # Dependencias y scripts del frontend
├── vercel.json                 # Configuración de despliegue y rewrites SPA en Vercel
└── README.md                   # Documentación principal del proyecto
```

---

## 💻 Cómo Ejecutar el Proyecto en Local

### Prerrequisitos
- **Node.js** 18+ y **npm** 9+.
- **Java JDK** 17 o superior.
- **Docker Desktop** (para levantar PostgreSQL fácilmente con Docker Compose) o un PostgreSQL 15 local.

---

### Paso 1: Iniciar la Base de Datos (PostgreSQL)

Desde la raíz del proyecto, ejecutá:

```bash
docker compose up -d postgres
```

Esto levantará PostgreSQL 15 en el puerto `5432` con la base de datos `yokai_hardware_db` y usuario `postgres`.

---

### Paso 2: Iniciar el Backend (Spring Boot)

Podés usar el Maven Wrapper ubicado en la raíz del proyecto o dentro de `server/`:

```bash
# En Windows (PowerShell o CMD):
.\mvnw.cmd spring-boot:run

# En Linux o macOS:
./mvnw spring-boot:run
```

Flyway aplicará automáticamente las migraciones (`V1` a `V9`) y cargará el catálogo de productos y usuarios de prueba.

* **API REST base:** `http://localhost:8080/api`
* **Swagger UI:** `http://localhost:8080/swagger-ui.html`
* **OpenAPI Docs:** `http://localhost:8080/v3/api-docs`

#### Ejecutar Tests Unitarios y de Integración del Backend:
```bash
.\mvnw.cmd test
```

---

### Paso 3: Iniciar el Frontend (React + Vite)

1. **Instalar las dependencias de Node:**
   ```bash
   npm install
   ```

2. **Configurar las variables de entorno:**
   Copiá el archivo `.env.example` creando `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Por defecto `VITE_API_URL=http://localhost:8080` ya apunta al backend local).*

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abrí tu navegador en: [http://localhost:5173](http://localhost:5173).

4. **Compilar para producción:**
   ```bash
   npm run build
   npm run preview
   ```

---

## 👥 Credenciales de Prueba Preconfiguradas

El seed de desarrollo (`db/seed/dev/R__seed_demo.sql`) incluye usuarios de prueba para verificar los flujos de cliente y administrador:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@yokaihardware.com.ar` | `Admin123!` | Acceso completo al panel `/admin` (ABM productos, categorías, control de stock y cambio de estados de pedidos). |
| **CLIENTE** | `cliente@yokaihardware.com.ar` | `Cliente123!` | Catálogo, carrito persistente, checkout transaccional y consulta de sus pedidos en `/pedidos`. |
| **CLIENTE** | `abril.dev@yokaihardware.com.ar` | `Cliente123!` | Cuenta secundaria para probar concurrencia de compras y stock. |

---

## 🧪 Colección de Pruebas en Postman

El repositorio incluye una colección integral y documentada de Postman con pruebas automatizadas para todos los endpoints:

* **Archivo:** [`docs/yokai_hardware_api.postman_collection.json`](./docs/yokai_hardware_api.postman_collection.json)
* **Cómo usarla:**
  1. Abrí Postman y hacé clic en **Import**.
  2. Seleccioná el archivo `docs/yokai_hardware_api.postman_collection.json`.
  3. Ejecutá la colección con el *Collection Runner*. Cubre autenticación, validación de stock, transiciones de pedidos y permisos de administrador.

---

## 🌐 Guía de Despliegue en la Nube

### 1. Frontend en Vercel
El archivo [`vercel.json`](./vercel.json) define el framework Vite, el comando de build (`npm run build`), la carpeta de salida (`dist`) y las reglas de reescritura SPA para que las rutas internas (`/catalogo`, `/producto/:id`, `/pedidos`, `/admin`) funcionen al recargar.

1. **Despliegue mediante Vercel CLI:**
   ```bash
   # Vincular proyecto
   vercel link --yes --project yokai-hardware-frontend

   # Configurar variables de entorno
   vercel env add VITE_API_URL --environment production --environment preview --value "https://yokai-hardware-api.onrender.com" --no-sensitive --yes --force
   vercel env add VITE_USE_MOCKS --environment production --environment preview --value "false" --no-sensitive --yes --force

   # Desplegar a producción
   vercel deploy --prod --yes
   ```
2. **URL activa:** [https://yokai-hardware-frontend.vercel.app](https://yokai-hardware-frontend.vercel.app)

### 2. Backend y Base de Datos en Render
El proyecto cuenta con un [`Dockerfile`](./Dockerfile) multi-etapa y un Blueprint de infraestructura como código [`render.yaml`](./render.yaml).

1. **Base de Datos PostgreSQL en Render:**
   - Instancia gestionada `yokai-hardware-db` (PostgreSQL 16) con SSL obligatorio (`sslmode=require`).
   - Flyway ejecuta las migraciones DDL (`V1` a `V9`) y semillas de datos automáticamente en el inicio.

2. **Web Service en Render:**
   - Desplegado mediante `Render CLI` con entorno Docker.
   - Variables de entorno configuradas:
     - `SPRING_PROFILES_ACTIVE`: `prod`
     - `PORT`: `8080`
     - `DB_URL`: `jdbc:postgresql://<host>:5432/<dbname>?sslmode=require`
     - `DB_USER`: Usuario generado por Render Postgres
     - `DB_PASSWORD`: Contraseña de Render Postgres
     - `JWT_SECRET`: Clave HMAC-SHA256 para tokens JWT
     - `CORS_ALLOWED_ORIGINS`: `http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://yokai-hardware-frontend.vercel.app`
3. **Health Check y Swagger:**
   - Endpoint de salud: [https://yokai-hardware-api.onrender.com/api/health](https://yokai-hardware-api.onrender.com/api/health)
   - Swagger UI interactivo: [https://yokai-hardware-api.onrender.com/swagger-ui.html](https://yokai-hardware-api.onrender.com/swagger-ui.html)

---

## 📜 Licencia y Uso Académico

Proyecto desarrollado con fines estrictamente académicos para la cátedra de **Programación IV** de la **Universidad Tecnológica Nacional (UTN) — Facultad Regional San Rafael**, ciclo lectivo 2026.
