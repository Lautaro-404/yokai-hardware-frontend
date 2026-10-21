# Guía de Despliegue, Migraciones y Verificación de Base de Datos
## Yokai Hardware E-Commerce (PostgreSQL 15+)

---

## 1. Entorno de Desarrollo Local con Docker

### Paso 1: Levantar el contenedor de PostgreSQL
En la raíz del proyecto ejecutar:
```bash
docker compose up -d
```
Esto inicializará una instancia de PostgreSQL 15 en `localhost:5432` con la base de datos `yokai_hardware_db` y aprovisionará los roles mediante `db/ops/crear_roles.sql`.

### Paso 2: Ejecutar las migraciones y seed
Si estás ejecutando el backend en Spring Boot, al arrancar con el perfil `dev` (`-Dspring.profiles.active=dev`), Flyway aplicará automáticamente:
1. `V1__crear_usuario.sql`
2. `V2__crear_catalogo.sql`
3. `V3__crear_carrito.sql`
4. `V4__crear_pedidos.sql`
5. `V5__indices.sql`
6. `V6__validacion_especificaciones.sql`
7. `V7__permisos_app.sql`
8. `R__seed_referencia.sql`
9. `R__seed_demo.sql`

Para aplicar manualmente con `psql`:
```bash
# Conectar a la base local
psql -h localhost -p 5432 -U postgres -d yokai_hardware_db

# Ejecutar las migraciones en orden secuencial
\i db/migration/V1__crear_usuario.sql
\i db/migration/V2__crear_catalogo.sql
\i db/migration/V3__crear_carrito.sql
\i db/migration/V4__crear_pedidos.sql
\i db/migration/V5__indices.sql
\i db/migration/V6__validacion_especificaciones.sql
\i db/migration/V7__permisos_app.sql

# Cargar seeds
\i db/seed/R__seed_referencia.sql
\i db/seed/dev/R__seed_demo.sql
```

---

## 2. Despliegue en la Nube (Render / Neon / Supabase)

### Paso 1: Crear la Base de Datos Gestionada
1. **En Render / Neon / Supabase**: Crear una base de datos PostgreSQL versión 15 o superior.
2. Copiar la URI de conexión externa proporcionada por la plataforma (debe incluir `sslmode=require`).

### Paso 2: Aprovisionar Roles de Seguridad (Opcional si la plataforma lo permite)
Ejecutar desde tu cliente SQL (`psql` o DBeaver) conectado como usuario administrador:
```bash
psql "<CONNECTION_STRING>" -f db/ops/crear_roles.sql
```

### Paso 3: Configurar Variables de Entorno en el Servicio Backend
En el panel de Render o en tu servidor de producción, configurar:
```env
SPRING_PROFILES_ACTIVE=prod
DB_HOST=dpg-xxxxxx.render.com (o ep-xxxx.neon.tech)
DB_PORT=5432
DB_NAME=yokai_hardware_db
DB_USER=yokai_app (o el usuario provisto por Render)
DB_PASSWORD=tu_password_seguro
```

---

## 3. Verificación Post-Despliegue

Para comprobar la integridad referencial, conteo de tablas, restricciones CHECK, índices y los datos del seed:
```bash
psql -h localhost -U postgres -d yokai_hardware_db -f db/validacion.sql
```
O en la nube:
```bash
psql "<CONNECTION_STRING>" -f db/validacion.sql
```

### Checklist de Aceptación Esperado en `validacion.sql`:
- [x] **8 tablas creadas** en el esquema `public`.
- [x] **Claves foráneas con políticas RESTRICT** hacia `producto`, `usuario` y `categoria`.
- [x] **Restricción UNIQUE compuesta** en `carrito_item(usuario_id, producto_id)`.
- [x] **Restricciones CHECK activas**: precios positivos, stock no negativo, estados legales.
- [x] **Índices presentes**: B-Tree facetados, GIN `jsonb_path_ops`, expresión sobre `socket`, GIN trigram en `nombre`.
- [x] **24 productos iniciales** con estado de inventario (`estado_stock`) calculado correctamente en disco.
- [x] **Usuarios semilla**: Admin y Clientes listos para autenticación BCrypt.
