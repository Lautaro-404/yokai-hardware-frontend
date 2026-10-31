# 妖怪 Yokai Hardware — E-Commerce de Hardware & Tecnología

Proyecto Integrador de **Programación IV** — **UTN Facultad Regional San Rafael**  
**Grupo:** *Print("Estoy Cansado Jefe")* (10 integrantes)  
**Entrega:** Noviembre 2026

Plataforma e-commerce completa de hardware y computación (procesadores, placas de video, memorias RAM, almacenamiento SSD, fuentes de poder, gabinetes y periféricos) con identidad visual inspirada en el folclore japonés (**Kinpaku & Sumi**). Diseñada con arquitectura en capas desacopladas: frontend SPA reactivo en **React + Vite** y backend RESTful en **Java + Spring Boot** con seguridad **JWT**, persistencia transaccional en **PostgreSQL 15** y migraciones versionadas con **Flyway**.

---

## 🌐 URLs del Despliegue en Producción

| Servicio | Entorno | URL Pública |
| :--- | :--- | :--- |
| **Frontend Web (React SPA)** | Producción (Vercel) | [https://yokai-hardware.vercel.app](https://yokai-hardware.vercel.app) *(o configurar en Vercel según `URL_DEPLOY_FRONTEND`)* |
| **Backend REST API** | Producción (Cloud Hosting) | `https://yokai-hardware-api.onrender.com/api` *(configurable vía `VITE_API_URL`)* |
| **Documentación OpenAPI / Swagger** | Producción / Staging | `https://yokai-hardware-api.onrender.com/swagger-ui.html` |
| **API Health Check** | Producción | `https://yokai-hardware-api.onrender.com/api/health` |

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
El archivo [`vercel.json`](./vercel.json) ya define el comando de compilación (`npm run build`), la carpeta de salida (`dist`) y las reglas de reescritura para que las rutas SPA (`/catalogo`, `/producto/:id`, `/pedidos`, `/admin`) funcionen al recargar la página.

1. Creá un nuevo proyecto en [Vercel](https://vercel.com/new) e importá el repositorio.
2. En **Settings → Environment Variables**, configurá:
   - `VITE_API_URL`: URL pública de la API REST del backend (por ejemplo: `https://TU-BACKEND.onrender.com`).
3. Desplegá el proyecto.

### 2. Backend en Render / Railway / Fly.io
1. Crear una base de datos PostgreSQL gestionada (con SSL habilitado).
2. Crear un Web Service apuntando a la carpeta `server/` con comando de compilación:
   ```bash
   mvn clean package -DskipTests
   ```
   y comando de inicio:
   ```bash
   java -jar target/yokai-hardware-api-1.0.0.jar
   ```
3. Configurar las variables de entorno:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `DB_URL`: `jdbc:postgresql://<host>:<port>/<dbname>?sslmode=require`
   - `DB_USER`: Usuario de la base de datos
   - `DB_PASSWORD`: Contraseña de la base de datos
   - `JWT_SECRET`: Clave secreta aleatoria segura de al menos 32 caracteres
   - `CORS_ALLOWED_ORIGINS`: URL del frontend desplegado en Vercel (ej: `https://yokai-hardware.vercel.app`)

---

## 📜 Licencia y Uso Académico

Proyecto desarrollado con fines estrictamente académicos para la cátedra de **Programación IV** de la **Universidad Tecnológica Nacional (UTN) — Facultad Regional San Rafael**, ciclo lectivo 2026.
