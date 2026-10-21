# ROL
Actuá como un arquitecto de bases de datos senior especializado en PostgreSQL y e-commerce, con experiencia en integración con Spring Boot 3 / Hibernate 6 / Spring Data JPA.

# CONTEXTO DEL PROYECTO
Proyecto "Yokai Hardware E-Commerce" (UTN San Rafael, Programación IV). Tienda online de hardware de PC con temática yokai japonesa.
- Backend: Java 17 + Spring Boot 3.x, Spring Security 6 con JWT stateless, BCrypt, RBAC (ROLE_CLIENTE / ROLE_ADMIN).
- Acceso a datos: Spring Data JPA + Hibernate 6 + HikariCP.
- Base de datos: PostgreSQL 15+, normalizada hasta 3FN, hosteada en Supabase o Neon.
- Frontend: React 18 consumiendo API REST.
- Equipo de 10 integrantes. Entrega final: 10/11/2026. La BD debe estar lista en la ventana "Fase 2 & 3" (19–28 de octubre de 2026).

# OBJETIVO DE ESTE PROMPT
Producir ÚNICAMENTE EL PLAN para crear la base de datos. NO escribas todavía los scripts completos (schema.sql, seed.sql, migraciones). Solo se admiten fragmentos SQL cortos (máx. 15 líneas) para ilustrar una decisión. La ejecución se hará en un paso posterior, a partir de este plan aprobado.

# REQUISITOS QUE EL PLAN DEBE CUBRIR

## 1. Modelo de datos (según el documento de arquitectura)
- usuario: id BIGSERIAL PK, nombre VARCHAR(100), email VARCHAR(120) UNIQUE, password VARCHAR(255) (BCrypt), rol VARCHAR(20) (CLIENTE | ADMIN), direccion TEXT, created_at TIMESTAMP.
- categoria: id BIGSERIAL PK, nombre VARCHAR(50), descripcion TEXT. Categorías temáticas: Oni (GPUs), Kitsune (CPUs), Tengu (RAM), más placas madre, fuentes, gabinetes y almacenamiento.
- marca: id PK, nombre.
- producto: id BIGSERIAL PK, sku VARCHAR(50) UNIQUE, nombre VARCHAR(150), precio DECIMAL(12,2), stock INTEGER, stock_minimo INTEGER, categoria_id FK, marca_id FK, especificaciones JSONB/TEXT. Estado de stock calculado: "En stock" (> mínimo), "Últimas unidades" (<= mínimo), "Sin stock" (0).
- carrito_item: id PK, usuario_id FK, producto_id FK, cantidad.
- pedido: id_pedido BIGSERIAL PK, usuario_id FK, fecha TIMESTAMP, estado VARCHAR(30), total DECIMAL(12,2), direccion_envio TEXT.
- detalle_pedido: id_detalle BIGSERIAL PK, pedido_id FK, producto_id FK, cantidad, precio_unit (precio congelado).
- reserva_stock (deseable): producto_id, usuario_id, expiración.

## 2. Reglas de integridad y concurrencia
- Checkout atómico (@Transactional): validar stock, descontar, insertar pedido + detalle, vaciar carrito; rollback total ante fallo.
- Estrategia anti-overselling: comparar bloqueo pesimista (SELECT ... FOR UPDATE), optimista (@Version) y UPDATE condicional (WHERE stock >= :cantidad); recomendar una.
- CHECK constraints, UNIQUE (usuario_id, producto_id) en carrito, política ON DELETE/ON UPDATE por FK.
- Inmutabilidad histórica de precios en pedidos.

## 3. Soporte al motor de compatibilidad de hardware
El CompatibilidadEngine valida:
- cpu.socket == motherboard.socket
- psu.watts >= (cpu.tdp + gpu.tdp) * 1.25
- gpu.length_mm <= case.max_gpu_mm (y altura de disipador vs ancho de gabinete)
El plan debe definir la estructura del JSONB `especificaciones` por categoría (claves normalizadas) y evaluar si algún atributo crítico conviene como columna.

## 4. Rendimiento y seguridad
- Índices para catálogo facetado (categoría, marca, precio, stock, paginación), historial de pedidos y panel admin (stock bajo, pedidos por estado).
- Rol de aplicación con privilegios mínimos, credenciales por variables de entorno, SSL hacia Supabase/Neon.

## 5. Criterios de la cátedra
BD normalizada con script de creación y seed, carrito con validación de stock, deploy público, y trazabilidad en GitHub de los 10 integrantes (repartir tareas de BD entre varios).

# DECISIONES DE DISEÑO Y ARQUITECTURA (RESUELTAS)
1. Estados del pedido y máquina de estados:
   - Decisión: Unificar en un ciclo de vida lineal y robusto con los estados: PENDIENTE_PAGO, PAGADO, EN_PREPARACION, ENVIADO, ENTREGADO y CANCELADO.
     * Transiciones válidas:
       - PENDIENTE_PAGO -> PAGADO | CANCELADO
       - PAGADO -> EN_PREPARACION | CANCELADO (reembolso)
       - EN_PREPARACION -> ENVIADO | CANCELADO
       - ENVIADO -> ENTREGADO
   - Justificación: Elimina la discrepancia entre el checkout inicial y el panel de administración. Provee trazabilidad clara de la operatoria logística y financiera sin ambigüedades.
   - Alternativa descartada: Separar estados de pago en un booleano (is_paid) y estados logísticos por otro lado. Descartado porque propicia condiciones de carrera y estados inconsistentes.

2. Carrito de compras:
   - Decisión: Esquema híbrido (Guest en LocalStorage -> Sync en Auth a tabla 'carrito_item').
     * Usuarios anónimos: Almacenan su carrito en LocalStorage.
     * Al iniciar sesión/registrarse: El frontend envía el contenido al endpoint de sincronización (/api/carrito/sync), el backend valida stock, consolida cantidades y vacía el LocalStorage.
   - Justificación: Optimiza recursos al no sobrecargar la base de datos con sesiones anónimas y carritos abandonados, garantizando al mismo tiempo persistencia multidispositivo para usuarios registrados.
   - Alternativa descartada: Carrito únicamente en LocalStorage hasta la orden. Descartado porque rompe la experiencia de usuario multidispositivo.

3. Especificaciones técnicas de producto:
   - Decisión: Usar JSONB (en PostgreSQL) mapeado a estructuras Java correspondientes.
   - Justificación: Brinda flexibilidad para categorías con atributos heterogéneos sin caer en el antipatrón EAV (Entity-Attribute-Value), permitiendo además indexación GIN y consultas/filtros eficientes directo en SQL.
   - Alternativa descartada: Columna TEXT/VARCHAR. Descartado porque no valida integridad JSON a nivel de motor y exige parsear strings completos en memoria.

4. Reserva temporal de stock:
   - Decisión: Fuera del MVP. Se implementa descuento transaccional atómico al momento de confirmarse el pago (PAGADO).
   - Justificación: Un sistema de bloqueo temporal con expiración (TTL) requiere infraestructura asíncrona adicional (jobs programados o colas) que desvía el foco del MVP y agrega riesgo.
   - Alternativa descartada: Reserva temporal con cuenta regresiva en checkout. Descartado por complejidad operativa y sobrecosto de desarrollo.

5. Borrado de productos del catálogo:
   - Decisión: Soft Delete mediante bandera booleana 'activo' (o 'deleted_at TIMESTAMP') combinada con @SQLRestriction / @Where en Spring Data JPA.
   - Justificación: Preserva la integridad referencial histórica indispensable en e-commerce. Permite que órdenes antiguas sigan vinculadas al producto sin generar errores de FK.
   - Alternativa descartada: Borrado físico (DELETE CASCADE). Descartado de forma estricta por romper la trazabilidad contable.

6. Estrategia de auditoría:
   - Decisión: Auditoría a nivel de aplicación mediante Spring Data JPA Auditing (@CreatedDate, @LastModifiedDate, @CreatedBy) y Hibernate Envers si se requiere historial de cambios.
   - Justificación: Mantiene la lógica de auditoría integrada al código Java y simplifica las pruebas automatizadas (Testcontainers).
   - Alternativa descartada: Triggers en la BD. Descartado por ocultar lógica de negocio fuera del control del backend.

7. Versionado de base de datos y ddl-auto:
   - Decisión: Flyway con scripts de migración SQL versionados.
     * Configuración de spring.jpa.hibernate.ddl-auto:
       - Perfil 'dev': validate
       - Perfil 'test': create-drop (o validate con esquema inicial cargado)
       - Perfil 'prod': validate
   - Justificación: Flyway utiliza SQL plano, reduciendo complejidad frente a Liquibase. Mantener ddl-auto en 'validate' evita modificaciones silenciosas o destructivas de Hibernate.
   - Alternativa descartada: ddl-auto en 'update'. Descartado porque no elimina columnas en desuso y genera discrepancias entre entornos.

8. Manejo de moneda y precisión para ARS:
   - Decisión: Columna NUMERIC(12, 2) o DECIMAL(12, 2) en BD, mapeada a BigDecimal en Java con redondeo explícito (RoundingMode.HALF_UP).
   - Justificación: Previene inconsistencias de cálculo de punto flotante en importes, respetando el formato estándar para ARS y normas de AFIP.
   - Alternativa descartada: Tipos Float/Double por errores de redondeo binario acumulativo, y enteros en centavos por fricción innecesaria frente a servicios de pago locales.

# FORMATO DE SALIDA (respetalo)
1. **Resumen ejecutivo** (máx. 8 líneas).
2. **Decisiones tomadas**: tabla con decisión | opción elegida | alternativa descartada | motivo (basado en la sección de Decisiones Resueltas).
3. **Modelo de datos propuesto**: DER en Mermaid y diccionario de datos resumido (tabla | columna | tipo | restricciones).
4. **Estructura del JSONB** por categoría, con un ejemplo breve por categoría.
5. **Plan por fases** dentro del 19–28 de octubre: para cada fase, tareas numeradas, responsable (rol), dependencias, entregable y criterio de aceptación.
6. **Estrategia de índices** y consultas críticas a optimizar (lista, sin escribir el SQL completo).
7. **Estrategia de pruebas**: integridad, concurrencia del checkout, Testcontainers.
8. **Estructura del repositorio** para los scripts de BD (carpetas, nombres de migraciones, convención de ramas/PRs).
9. **Riesgos y mitigaciones**.
10. **Contrato de ejecución**: lista numerada y cerrada de los archivos y artefactos exactos que se generarán en la etapa de ejecución, con nombre y propósito de cada uno.

# REGLAS
- No generes los scripts completos todavía.
- No inventes requisitos que no estén en el contexto; si algo falta, marcalo como supuesto.
- Español rioplatense técnico, directo, sin relleno.