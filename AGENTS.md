# AGENTS.md

Guía para agentes de IA (y para el equipo) que trabajen en este repositorio. Se basa en el Plan de Proyecto y en el brief. Si algo de acá contradice una decisión nueva del grupo, mandan el grupo y el profesor: actualizá este archivo en el mismo cambio.

## Proyecto

- **Qué es:** e-commerce de hardware y tecnología (componentes de PC, notebooks, monitores, periféricos, redes, accesorios y sillas) con estética yokai.
- **Contexto:** proyecto integrador de Programación IV, UTN San Rafael. Grupo "Print("Estoy Cansado Jefe")", 10 integrantes.
- **Fecha de entrega:** martes 10 de noviembre de 2026. El miércoles 4 de noviembre se congelan las funcionalidades: después de esa fecha solo entran correcciones.
- **Público:** personas de 18 a 35 años (estudiantes, trabajadores y aficionados al gaming y la computación).
- **Idioma:** la interfaz, los mensajes de error visibles y la documentación van en español rioplatense neutro.

## Decisiones

**Ya decididas:** backend en Java, tipo de e-commerce "Computación" y temática yokai (por votación del grupo), base de datos PostgreSQL (sin alternativas) y frontend en React.

**Propuestas, por confirmar.** No asumas ninguna como cerrada; si necesitás una para avanzar, usá la propuesta y dejalo anotado en el PR:

- Spring Boot (Web, Data JPA, Security, Validation) sobre Java 17+.
- Autenticación con JWT y contraseñas con BCrypt.
- Herramienta de build del backend: Maven o Gradle.
- Hosting: Render, Railway, Fly.io o similar (backend y base de datos); Vercel o Netlify para el frontend.

## Alcance

Antes de escribir código, ubicá la tarea en una de estas tres categorías.

**MVP (prioridad absoluta):**

- Registro e inicio de sesión con roles `CLIENTE` y `ADMIN`.
- Base de datos relacional con usuarios, productos, categorías, marcas y pedidos.
- Catálogo con búsqueda y filtros (marca, rango de precio, categoría, disponibilidad) y paginación.
- Detalle de producto con imágenes, descripción y especificaciones.
- Carrito nativo (agregar, quitar, cambiar cantidad), checkout e historial de pedidos.
- Panel de administración: ABM de productos y categorías, control de stock y estados de pedidos.
- Estados de stock visibles ("En stock", "Últimas unidades", "Sin stock") y alerta de stock mínimo en el panel.
- Deploy funcional con URL pública.

**Deseable (solo si el MVP ya está desplegado; máximo uno o dos extras):** Mercado Pago en modo de prueba, favoritos, reseñas, comparador, armador de PC con validación de compatibilidad, email de confirmación, filtros por caso de uso, reserva temporal de stock, costo de envío por código postal.

**Fuera de alcance. No lo implementes ni lo propongas como parte de la entrega:** facturación electrónica, pagos con dinero real, logística de envíos reales, integración con redes sociales o marketplaces, y servicios de postventa (garantía directa, mantenimiento preventivo). El brief los describe como visión comercial.

## Arquitectura

Aplicación en capas. Cada capa solo habla con la inmediata inferior:

```
Navegador → Frontend → API REST (Security JWT → Controller → Service → Repository) → Base de datos
```

Paquetes del backend:

- `controller`: endpoints REST. Reciben y devuelven DTOs; no contienen lógica de negocio.
- `service`: reglas de negocio y transacciones.
- `repository`: acceso a datos con Spring Data JPA.
- `model`: entidades JPA.
- `dto`: objetos de entrada y salida de la API. Nunca expongas entidades directamente.
- `config`: seguridad, CORS, Swagger y configuración general.

## Frontend (React)

El frontend ya existe y es una aplicación React independiente que consume la API REST del backend. Antes de tocarlo, leé `package.json` para confirmar el empaquetador (por ejemplo, Vite), si usa JavaScript o TypeScript, el router y la librería de peticiones HTTP, y respetá lo que ya usa el proyecto en vez de cambiarlo.

- **Una sola capa de acceso a la API:** todas las llamadas al backend pasan por un módulo central (por ejemplo, `api/`). Los componentes no hacen `fetch` directo.
- **URL de la API por variable de entorno** (por ejemplo, `VITE_API_URL`), con un `.env.example` sin valores reales. No dejes URLs fijas a `localhost`.
- **El servidor es la fuente de verdad:** no calcules totales, precios ni disponibilidad de stock en el cliente; mostrá lo que devuelve la API.
- **Sesión:** el token JWT se manda en el header `Authorization: Bearer`. Si la API responde 401, se cierra la sesión y se redirige al login.
- **Rutas protegidas:** carrito, checkout e historial requieren sesión; el panel de administración requiere rol `ADMIN`.
- **Estados de cada pantalla:** toda pantalla que consulta la API tiene estado de carga, de vacío y de error con reintento, y los mensajes están en español.
- **Componentes:** pequeños y reutilizables, con nombres en `PascalCase`; la lógica de datos va en hooks o servicios, no dentro de la presentación.
- **Sin datos simulados** en las pantallas ya conectadas, ni `console.log` ni `TODO` sueltos en lo que se entrega.
- **Responsive** para móvil, tablet y escritorio, con foco visible, contraste legible y texto alternativo en las imágenes.
- **Deploy:** en Vercel o Netlify, con fallback a `index.html` para que las rutas internas funcionen al recargar.

## Modelo de datos

Usuario, Categoría, Marca, Producto, Carrito/ItemCarrito, Pedido, DetallePedido y, solo si se implementa la reserva temporal, ReservaStock.

- Un Producto pertenece a una Categoría y a una Marca, y tiene un SKU único.
- El estado de stock visible se calcula a partir de `stock` y `stockMinimo`; no se guarda como campo.
- Un Pedido tiene muchos DetallePedido, y cada detalle guarda el precio unitario del momento de la compra.

## Reglas de negocio

- **Stock:** al confirmar un pedido, validar la disponibilidad, crear el Pedido y los DetallePedido y descontar el stock en **una sola transacción**. Si algo falla, se revierte todo. Nunca permitas stock negativo.
- **Precios:** son fijos y se cargan desde el panel de administración. La actualización por inflación o tipo de cambio está por definir.
- **Roles:** las rutas `/api/admin/**` y las operaciones de ABM requieren rol `ADMIN`. Un cliente solo ve y modifica sus propios carritos y pedidos.
- **Pagos:** el carrito nativo es la base. Si se integra Mercado Pago, es en modo de prueba y nunca con credenciales reales.

## Seguridad

- No subas credenciales, claves ni tokens al repositorio. Usá variables de entorno y un `.env.example` sin valores reales.
- Validá todas las entradas (Bean Validation) y devolvé errores con un formato uniforme mediante un manejador global de excepciones.
- Nunca devuelvas contraseñas ni hashes en las respuestas.
- Configurá CORS solo para los orígenes necesarios.

## Convenciones de código

- Seguí las convenciones de Java estándar: clases en `PascalCase`, métodos y variables en `camelCase`, constantes en `MAYUSCULAS_CON_GUION_BAJO`.
- Las entidades del dominio usan los nombres del modelo de datos (`Usuario`, `Producto`, `Pedido`...). Mantené el mismo idioma dentro de cada capa.
- Métodos cortos, una responsabilidad por clase, sin código muerto ni comentarios que repitan lo que hace el código.
- Los endpoints devuelven códigos HTTP correctos (201 al crear, 400 por validación, 401/403 por autenticación y permisos, 404 si no existe, 409 por conflicto de stock).
- Documentá la API con Swagger/OpenAPI y mantené actualizada la colección de Postman.

## Git y colaboración

- Ramas: `main` (estable y desplegable), `develop` (integración) y `feature/*` (una por tarea).
- Nada se commitea directo a `main`. Todo entra por pull request hacia `develop`, con al menos una revisión.
- Commits pequeños y con mensajes claros en español (por ejemplo, `Agrega filtro por marca en el catálogo`).
- El criterio de éxito exige commits de **todos** los integrantes: no hagas squash masivo que borre la autoría.
- El `README` debe tener descripción, tecnologías, cómo ejecutar el proyecto y la URL del deploy.

## Pruebas

- JUnit para los servicios críticos: carrito, pedidos y stock.
- Antes de abrir un PR, corré las pruebas y verificá a mano el flujo que tocaste.
- El flujo completo a verificar en el entorno desplegado: registro, catálogo, carrito, compra y pedido visible en el panel.

## Comandos

La herramienta de build todavía no está confirmada. Cuando se defina, completá esta sección. Si se usa Maven, los comandos habituales son:

```bash
./mvnw spring-boot:run   # levantar el backend
./mvnw test              # correr las pruebas
./mvnw clean package     # generar el artefacto para el deploy
```

Frontend (verificá los nombres exactos de los scripts en `package.json`; estos son los habituales):

```bash
npm install        # instalar dependencias
npm run dev        # levantar el frontend en local
npm run build      # generar el build de producción
```

## Identidad visual

- Paleta oscura: negro, violeta y rojo.
- Máscaras y espíritus yokai como mascotas. Las categorías pueden tener nombres temáticos (por ejemplo, "Oni" para placas de video, "Kitsune" para procesadores, "Tengu" para memorias), pero el nombre real del producto siempre tiene que ser claro.
- Diseño responsive para móvil, tablet y escritorio, con mensajes claros de carga y de error.
- El nombre de la tienda está por definir. No lo inventes: usá un marcador (`NOMBRE_TIENDA`).

## Cómo trabajar con este repo (agentes)

- Si falta información o una decisión está pendiente, preguntá o dejá un `TODO` explícito. No inventes datos del negocio, precios reales ni nombres de integrantes.
- Priorizá el MVP sobre cualquier extra, y no agregues dependencias nuevas sin justificarlo en el PR.
- Hacé cambios acotados a la tarea. Si detectás un problema fuera de ella, anotalo aparte.
- Mantené sincronizados este archivo, el `README` y la documentación de la API cuando cambie la arquitectura.
