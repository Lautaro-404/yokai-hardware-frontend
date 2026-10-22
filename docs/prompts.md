# Plan de prompts: backend e integración con el frontend

Guía paso a paso con los prompts para copiar y pegar. Cubre el backend (Spring Boot + PostgreSQL), la integración con el frontend React y el cierre del proyecto. Se usa junto con `AGENTS.md`, que tiene que estar en la raíz del repositorio.

## Cómo trabajar cada paso

1. Creá una rama `feature/*` desde `develop`.
2. Pegá el prompt. Si el paso dice **/plan**, escribí `/plan ` antes del texto. Claude Code te muestra un plan sin editar nada: leelo, corregilo ("seguí planificando" con tus observaciones) y recién después aprobalo.
3. Probá el resultado y corré los tests.
4. Hacé commit, abrí el PR a `develop` y pasá al siguiente.

**Sobre `/plan`:** en Claude Code es un atajo que activa el modo plan (equivale a apretar Shift+Tab dos veces). Claude lee el código y propone cambios, pero no edita hasta que aprobás. Acepta una descripción: `/plan armar el login con JWT`. Si ejecutás Claude Code con permisos de bypass (`--dangerously-skip-permissions`), el modo plan deja de ser un bloqueo real y pasa a ser solo una instrucción: no uses ese modo en este proyecto.

**Si no usás Claude Code:** ignorá `/plan` y agregá al final de esos prompts: "Primero mostrame el plan y esperá mi aprobación antes de escribir código".

## Calendario sugerido

Las fechas salen del plan del proyecto y son orientativas. Cada paso del frontend depende de que el backend correspondiente ya esté listo.

| Paso | Qué hace | /plan | Fecha |
|---|---|---|---|
| A1 | Puente entre `CLAUDE.md` y `AGENTS.md` | No | jue 22 oct |
| A2 | Reconocimiento del backend y la base | **Sí** | jue 22 oct |
| B1 | Proyecto base y conexión | No | vie 23 oct |
| B2 | Entidades y repositorios | No | vie 23 oct |
| B3 | Autenticación y roles | **Sí** | sáb 24 – dom 25 oct |
| B4 | Categorías y marcas | No | lun 26 oct |
| B5 | Productos y filtros | No | lun 26 oct |
| B6 | Carrito | No | mar 27 oct |
| B7 | Pedidos y stock | **Sí** | mar 27 – mié 28 oct |
| B8 | Errores, Swagger y Postman | No | mié 28 oct |
| B9 | Pruebas de servicios críticos | No | mié 28 oct |
| B10 | Seguridad y preparación del deploy | **Sí** | mié 28 oct |
| C0 | Reconocimiento del frontend React | **Sí** | jue 22 oct |
| C1 | Capa de acceso a la API | **Sí** | vie 23 oct |
| C2 | Login, registro y sesión | No | lun 26 oct |
| C3 | Catálogo y detalle | No | lun 26 – mar 27 oct |
| C4 | Carrito | No | mié 28 oct |
| C5 | Checkout y pedidos | **Sí** | jue 29 oct |
| C6 | Panel de administración | No | jue 29 – vie 30 oct |
| C7 | Estados, errores y experiencia | No | vie 30 oct |
| C8 | Responsive y temática yokai | No | vie 30 oct |
| C9 | Prueba del flujo completo | No | lun 2 nov |
| C10 | Deploy del frontend | **Sí** | mar 3 nov |
| D1 | Revisión final contra los criterios de éxito | No | mié 4 nov |

---

# Etapa A: Preparación

## A1. Puente para Claude Code

Claude Code lee `CLAUDE.md`, no `AGENTS.md`. Para que tome las reglas del proyecto, creá en la raíz un `CLAUDE.md` con una sola línea:

```text
@AGENTS.md
```

Es la forma habitual de importar un archivo en Claude Code; confirmalo en la documentación de memoria de Claude Code si tu versión se comporta distinto.

## A2. Reconocimiento del backend y la base de datos (usar /plan)

```text
/plan Leé AGENTS.md y respetalo en todo lo que hagas. Todavía no escribas código.

Revisá el repositorio y la base de datos PostgreSQL existente y dame un resumen con:
1. El esquema: tablas, columnas, tipos, claves y relaciones.
2. Las llamadas a la API que hace el frontend (rutas, métodos, cuerpos y respuestas que espera).
3. Diferencias entre lo que el frontend espera y lo que el esquema permite.
4. Una lista de endpoints propuestos para el backend, ordenada por prioridad del MVP.

No inventes nada: si algo no está claro, listalo como pregunta.
```

---

# Etapa B: Backend

## B1. Proyecto base y conexión

```text
Leé AGENTS.md. Creá el proyecto Spring Boot (Java 17+) con las dependencias Web, Data JPA, Security, Validation, PostgreSQL Driver y SpringDoc OpenAPI.

Armá los paquetes controller, service, repository, model, dto y config. Conectalo a la base PostgreSQL que ya existe, usando variables de entorno (DB_URL, DB_USER, DB_PASSWORD) y un archivo .env.example sin valores reales. Configurá ddl-auto en "validate" para que NO modifique el esquema existente. Configurá CORS para el origen del frontend en local.

Listo cuando: la app levanta, se conecta a la base y GET /api/health responde 200.
```

## B2. Entidades y repositorios

```text
Leé AGENTS.md. Creá las entidades JPA y sus repositorios mapeando EXACTAMENTE el esquema existente: Usuario, Categoria, Marca, Producto, Carrito/ItemCarrito, Pedido y DetallePedido.

Respetá las relaciones (una Categoría tiene muchos Productos, un Pedido tiene muchos DetallePedido, etc.). Incluí el SKU único en Producto si el esquema lo tiene. No agregues ReservaStock.

Listo cuando: la app levanta con ddl-auto=validate sin errores y hay un test que guarda y lee un Producto.
```

## B3. Autenticación y roles (usar /plan)

```text
/plan Leé AGENTS.md. Planificá e implementá autenticación con Spring Security y JWT:
- POST /api/auth/register (rol CLIENTE por defecto) y POST /api/auth/login (devuelve el token).
- Contraseñas con BCrypt; nunca las devuelvas en las respuestas.
- Filtro JWT que valide el token en cada pedido.
- Roles CLIENTE y ADMIN: las rutas /api/admin/** y los ABM requieren ADMIN; el catálogo (GET) es público.
- La clave del JWT y su expiración salen de variables de entorno.

Usá DTOs con validaciones. Listo cuando: puedo registrarme, loguearme, y una ruta /api/admin/** devuelve 403 con un cliente y 401 sin token.
```

## B4. Categorías y marcas

```text
Leé AGENTS.md. Implementá el CRUD de Categoría y Marca con controller, service y DTOs.
- GET públicos (listar y obtener por id).
- POST, PUT y DELETE solo para ADMIN.
- Validá que el nombre no esté vacío ni repetido, y que no se pueda borrar una categoría o marca con productos asociados (respondé 409 con un mensaje claro).

Listo cuando: todos los endpoints funcionan y hay tests de servicio para las validaciones.
```

## B5. Productos: catálogo, filtros y ABM

```text
Leé AGENTS.md. Implementá los productos:
- GET /api/productos con paginación, búsqueda por texto y filtros opcionales: categoría, marca, rango de precio y disponibilidad. Los parámetros son combinables.
- GET /api/productos/{id} con imágenes, descripción y especificaciones.
- ABM solo para ADMIN, con validación de precio mayor a 0 y stock mayor o igual a 0.
- Incluí en la respuesta el estado de stock calculado ("En stock", "Últimas unidades", "Sin stock") a partir de stock y stockMinimo; no lo guardes en la base.

Usá DTOs. Listo cuando: los filtros combinados devuelven lo correcto y hay tests del cálculo del estado de stock.
```

## B6. Carrito

```text
Leé AGENTS.md. Implementá el carrito nativo del usuario autenticado:
- GET /api/carrito, POST /api/carrito/items (agregar), PUT /api/carrito/items/{id} (cambiar cantidad), DELETE /api/carrito/items/{id} y DELETE /api/carrito (vaciar).
- Un solo item por producto: si se agrega de nuevo, se suma la cantidad.
- Validá que la cantidad sea mayor a 0 y no supere el stock disponible.
- Un usuario solo puede ver y modificar su propio carrito.
- La respuesta incluye subtotales y total calculados en el servidor.

Listo cuando: los tests cubren agregar, sumar, superar el stock y acceso a un carrito ajeno (debe dar 403).
```

## B7. Pedidos y stock (usar /plan)

```text
/plan Leé AGENTS.md. Planificá e implementá los pedidos:
- POST /api/pedidos: toma el carrito del usuario y los datos de envío, y en UNA sola transacción valida el stock de cada item, crea el Pedido y los DetallePedido (guardando el precio unitario del momento), descuenta el stock y vacía el carrito. Si algún producto no alcanza, se revierte todo y se responde 409 indicando cuál.
- GET /api/pedidos/mis-pedidos: historial del usuario.
- ADMIN: GET /api/admin/pedidos y PATCH /api/admin/pedidos/{id}/estado, con una lista de estados válidos y transiciones permitidas.
- El stock nunca puede quedar negativo.

Listo cuando: hay tests de servicio para compra exitosa, stock insuficiente con rollback y cambio de estado inválido.
```

## B8. Errores, Swagger y Postman

```text
Leé AGENTS.md. Agregá:
- Un manejador global de excepciones (@RestControllerAdvice) con un formato de error uniforme (código, mensaje y detalle de validaciones) y los códigos HTTP correctos: 400, 401, 403, 404 y 409.
- Documentación Swagger/OpenAPI de todos los endpoints, con el esquema de autenticación Bearer.
- Una colección de Postman (JSON exportado en /docs) con los flujos: registro, login, catálogo, carrito, pedido y panel de administración.

Listo cuando: Swagger UI muestra todos los endpoints y la colección corre de punta a punta.
```

## B9. Pruebas de los servicios críticos

```text
Leé AGENTS.md. Revisá la cobertura de tests de los servicios de carrito, pedidos y stock con JUnit y Mockito. Completá lo que falte, incluyendo los casos límite: cantidad cero, stock justo, stock insuficiente, pedido con carrito vacío y acceso de un usuario a datos ajenos.

No cambies el código de producción salvo que encuentres un bug; si lo encontrás, explicalo antes de corregirlo. Listo cuando: todos los tests pasan con el comando de test del proyecto.
```

## B10. Seguridad y preparación del deploy (usar /plan)

```text
/plan Leé AGENTS.md. Hacé una revisión de seguridad básica y preparalo para el deploy:
- Verificá que no haya credenciales ni claves en el repositorio (incluido el historial reciente) y que todo salga de variables de entorno.
- Confirmá que las rutas de administración están protegidas y que ninguna respuesta expone contraseñas.
- Creá un perfil de producción (application-prod) y, si corresponde, un Dockerfile.
- Escribí en el README cómo ejecutar el proyecto, las variables de entorno necesarias y cómo desplegar.

Mostrame los hallazgos antes de modificar nada que no sea documentación o configuración.
```

---

# Etapa C: Integración con el frontend (React)

## C0. Reconocimiento del frontend (usar /plan)

```text
/plan Leé AGENTS.md y respetalo. Todavía no escribas código.

Revisá el frontend React existente y dame un resumen con:
1. Empaquetador (por ejemplo, Vite), JavaScript o TypeScript, router, librería de peticiones HTTP, estructura de carpetas y cómo se ejecuta y se compila.
2. Las pantallas que existen: inicio, catálogo, detalle, carrito, checkout, login/registro, historial de pedidos y panel de administración. Indicá cuáles están completas y cuáles faltan.
3. De dónde sale hoy cada dato: qué pantallas usan datos simulados (mock, JSON locales o constantes) y cuáles ya llaman a una API.
4. Una tabla de las llamadas que el frontend necesita (pantalla, método, ruta, datos que envía y datos que espera) contrastada con los endpoints reales del backend, marcando las diferencias.

Usá lo que el proyecto ya tiene; no propongas cambiar de herramientas. Si algo no está claro, listalo como pregunta.
```

## C1. Capa de acceso a la API (usar /plan)

```text
/plan Leé AGENTS.md. Creá una única capa centralizada para hablar con el backend (por ejemplo, un módulo api/) y dejá de llamar a la API desde cada componente. Usá las librerías que el proyecto ya tiene.

- La URL base sale de una variable de entorno (VITE_API_URL o la equivalente del proyecto) y hay un .env.example sin valores reales.
- La capa agrega el token JWT en el header Authorization: Bearer a cada pedido, si existe.
- Centraliza el manejo de errores: convierte las respuestas del backend (400, 401, 403, 404, 409) en errores con un mensaje legible para el usuario.
- Dejá una función por recurso (auth, productos, categorías, carrito, pedidos, admin), sin lógica de pantalla adentro.

Listo cuando: una llamada de prueba a GET /api/health desde el frontend responde 200 sin errores de CORS.
```

## C2. Login, registro y sesión

```text
Leé AGENTS.md. Conectá el login y el registro con POST /api/auth/login y POST /api/auth/register.

- Guardá el token y los datos básicos del usuario (nombre y rol) de forma consistente y borralos al cerrar sesión.
- Al recargar la página, la sesión se restaura si el token sigue vigente.
- Si el backend responde 401, cerrá la sesión y redirigí al login con un mensaje claro.
- Protegé las rutas: carrito, checkout e historial requieren sesión; el panel de administración requiere rol ADMIN. Un cliente que intente entrar ve una pantalla de acceso denegado.
- Validá los formularios en el cliente (email válido, contraseña mínima) y mostrá los errores de validación del backend, campo por campo.
- El encabezado cambia según la sesión: iniciar sesión o registrarse, o el nombre del usuario y cerrar sesión.

Listo cuando: puedo registrarme, loguearme, recargar sin perder la sesión y cerrar sesión, y un cliente no puede abrir el panel.
```

## C3. Catálogo y detalle de producto

```text
Leé AGENTS.md. Conectá el catálogo y el detalle con la API real y eliminá los datos simulados de estas pantallas.

- Catálogo con GET /api/productos: paginación, búsqueda por texto y filtros de categoría, marca, rango de precio y disponibilidad. Los filtros son combinables y se reflejan en la URL.
- Las listas de categorías y marcas de los filtros salen de la API.
- Cada tarjeta muestra imagen, nombre, precio y el estado de stock que devuelve el backend. Los productos sin stock no permiten agregar al carrito.
- Detalle con GET /api/productos/{id}: imágenes, descripción y especificaciones.
- Estados de carga, de lista vacía ("No encontramos productos con esos filtros") y de error con opción de reintentar.

Listo cuando: puedo navegar y filtrar el catálogo completo contra la base de datos real, sin datos faltantes.
```

## C4. Carrito

```text
Leé AGENTS.md. Conectá el carrito con la API (GET /api/carrito, POST /api/carrito/items, PUT /api/carrito/items/{id}, DELETE /api/carrito/items/{id} y DELETE /api/carrito).

- El servidor es la única fuente de verdad: no calcules totales en el cliente; mostrá los subtotales y el total que devuelve el backend.
- Agregar, quitar y cambiar cantidad actualizan la pantalla con la respuesta del servidor.
- Si el backend responde 409 por stock insuficiente, mostrá qué producto y cuántas unidades hay disponibles.
- El ícono del carrito en el encabezado muestra la cantidad de items.
- Carrito vacío: mensaje claro con un botón para ir al catálogo.
- Si el usuario no tiene sesión y toca "Agregar al carrito", llevalo al login y, al volver, retomá la acción.

Listo cuando: puedo agregar, sumar, cambiar cantidades, quitar y vaciar, y el stock insuficiente se explica bien.
```

## C5. Checkout y pedidos (usar /plan)

```text
/plan Leé AGENTS.md. Conectá el checkout y el historial de pedidos.

- Checkout: formulario de datos de envío (validado), resumen del carrito y botón "Confirmar pedido" que llama a POST /api/pedidos. Mientras se procesa, deshabilitá el botón para evitar pedidos duplicados.
- Si el backend responde 409 por stock, volvé al carrito indicando qué producto falló; no pierdas lo que el usuario ya completó.
- Si sale bien, mostrá una pantalla de confirmación con el número y el resumen del pedido, y vaciá el estado local del carrito.
- Historial: GET /api/pedidos/mis-pedidos con fecha, estado, total y el detalle de cada pedido. Los estados se muestran con etiquetas claras.
- Sin pedidos: mensaje con un botón para ir al catálogo.

Listo cuando: puedo completar una compra de punta a punta y verla en el historial con el stock descontado en el catálogo.
```

## C6. Panel de administración

```text
Leé AGENTS.md. Conectá el panel de administración (solo rol ADMIN):

- Productos: listado con búsqueda y paginación, formulario de alta y edición (precio mayor a 0, stock mayor o igual a 0, categoría y marca obligatorias), baja con confirmación y alerta visual cuando el stock está por debajo del mínimo.
- Categorías y marcas: alta, edición y baja. Si el backend responde 409 porque tienen productos asociados, mostrá ese mensaje.
- Pedidos: listado con GET /api/admin/pedidos y cambio de estado con PATCH /api/admin/pedidos/{id}/estado, mostrando solo las transiciones válidas.
- Cada acción confirma el resultado (éxito o error) con un aviso visible.

Listo cuando: como administrador puedo gestionar productos, categorías y pedidos, y como cliente no puedo acceder a nada de esto.
```

## C7. Estados, errores y experiencia de uso

```text
Leé AGENTS.md. Hacé una pasada transversal de calidad sobre todo el frontend, sin agregar funcionalidades nuevas:

- Toda pantalla que consulta la API tiene estado de carga, de vacío y de error con reintento.
- Los errores del backend se muestran con mensajes en español, claros y accionables; nunca un error técnico crudo ni una pantalla en blanco.
- Si falla la conexión con el servidor, mostrá un mensaje general y no rompas la navegación.
- Los botones que disparan una acción quedan deshabilitados mientras se procesa.
- Revisá que no queden datos simulados, console.log, TODO sueltos ni URLs fijas a localhost.

Dame un listado de lo que encontraste y corregiste.
```

## C8. Responsive y temática yokai

```text
Leé AGENTS.md. Revisá el diseño del frontend en tres anchos (móvil de 375 px, tablet de 768 px y escritorio de 1280 px) y corregí lo que se rompa: desbordes, tablas que no scrollean, menús inutilizables, botones muy chicos para tocar, textos cortados.

Mantené la identidad visual: paleta oscura (negro, violeta y rojo) con la estética yokai. Verificá el contraste del texto, que el foco del teclado se vea y que las imágenes tengan texto alternativo.

Listo cuando: el flujo completo (catálogo, carrito, checkout y panel) se puede usar sin problemas en los tres anchos. Listame los cambios que hiciste.
```

## C9. Prueba del flujo completo

```text
Leé AGENTS.md. Con backend y frontend corriendo en local, recorré y verificá estos flujos, y reportame un resultado por cada uno (funciona, falla o falla parcial, con el detalle):

1. Registro y login como cliente, recarga con sesión activa y cierre de sesión.
2. Catálogo: búsqueda, cada filtro por separado y combinados, paginación y detalle.
3. Carrito: agregar, sumar, cambiar cantidad, quitar, vaciar y stock insuficiente.
4. Compra completa y pedido visible en el historial, con el stock descontado.
5. Intento de comprar un producto sin stock y con stock justo.
6. Como cliente, intentar entrar al panel (debe ser rechazado).
7. Como administrador: alta y edición de un producto, cambio de estado de un pedido y alerta de stock mínimo.

No corrijas nada todavía: primero mostrame el reporte con las causas probables de cada falla.
```

## C10. Deploy del frontend (usar /plan)

```text
/plan Leé AGENTS.md. Preparalo para el deploy en Vercel o Netlify:

- Configurá las variables de entorno de producción (URL pública de la API) y dejá documentado en el README cuáles son.
- Verificá que el build de producción compile sin errores ni advertencias importantes.
- Configurá el hosting con el fallback a index.html para que las rutas internas funcionen al recargar.
- Listame qué hay que ajustar en el backend para producción (por ejemplo, agregar el origen del frontend desplegado a CORS), sin modificarlo.
- Agregá al README los pasos para ejecutar el frontend en local y desplegarlo.

Listo cuando: con la URL pública del frontend puedo completar una compra contra el backend desplegado.
```

---

# Etapa D: Cierre

## D1. Revisión final contra los criterios de éxito

```text
Leé AGENTS.md y el plan del proyecto. Verificá estos criterios de éxito en el entorno desplegado y reportame cada uno como cumplido o no, con evidencia:

1. Catálogo con al menos 10 productos con imagen, precio y stock visibles.
2. Compra completa sin errores, de principio a fin.
3. Diseño responsive en móvil, tablet y escritorio.
4. Repositorio con commits de todos los integrantes y README actualizado (descripción, tecnologías, cómo ejecutarlo y URL del deploy).
5. Sin credenciales en el repositorio y rutas de administración protegidas.
6. Todo lo del MVP de AGENTS.md funcionando, y nada del "fuera de alcance" implementado.

No modifiques nada: solo reportá lo que falta.
```

---

# Extras

## Mercado Pago en modo de prueba (solo con el MVP ya desplegado) (usar /plan)

```text
/plan Leé AGENTS.md. Integrá Mercado Pago en MODO DE PRUEBA (credenciales de sandbox por variables de entorno) como método de pago del checkout, sin quitar el carrito nativo. Creá la preferencia de pago al confirmar el pedido y manejá el retorno (aprobado, pendiente y rechazado) actualizando el estado del pedido. Incluí lo necesario en el frontend para redirigir y volver.

No uses credenciales reales ni las subas al repositorio. Explicame cómo probarlo con los usuarios de prueba.
```

## Prompt de corrección (cuando algo falle)

```text
Leé AGENTS.md. Este flujo falla: [describí qué hacías, qué esperabas y qué pasó, con el mensaje de error de la consola o de la pestaña Network si lo tenés].

Primero explicame la causa probable y si el problema está en el frontend o en el backend. Después proponé la corrección más chica posible y aplicala solo si el problema es del frontend. Si es del backend, decime qué hay que cambiar y no lo toques.
```

---

## Por qué estos pasos usan /plan

- **Reconocimientos (A2 y C0):** tienen que leer el proyecto sin tocar nada.
- **Autenticación, pedidos y stock (B3 y B7):** un error acá rompe todo lo demás.
- **Capa de API, checkout y deploys (C1, C5, B10 y C10):** definen decisiones que después son caras de cambiar.
- **El resto:** el prompt ya es lo bastante acotado para ejecutarlo directo.
