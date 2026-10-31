-- ============================================================================
-- db/ops/crear_roles.sql
-- Yokai Hardware E-Commerce - Aprovisionamiento de Roles y Privilegios
-- Motor: PostgreSQL 15+
-- Ejecutar como superusuario (postgres) o administrador de la base de datos
-- ============================================================================

-- IMPORTANTE: Reemplazar las contraseñas temporales mediante variables de entorno antes de ejecutar.
-- En psql se puede ejecutar:
-- \set app_pass `echo "$DB_APP_PASSWORD"`
-- \set migrator_pass `echo "$DB_MIGRATOR_PASSWORD"`

DO $$
BEGIN
    -- 1. Rol de Migración (Flyway): Responsable de aplicar DDL y mantener schema_version
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yokai_migrator') THEN
        CREATE ROLE yokai_migrator WITH LOGIN PASSWORD 'CAMBIAR_EN_PRODUCCION_MIGRATOR';
    END IF;

    -- 2. Rol de Aplicación (Spring Boot / HikariCP): Solo operaciones DML en runtime
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yokai_app') THEN
        CREATE ROLE yokai_app WITH LOGIN PASSWORD 'CAMBIAR_EN_PRODUCCION_APP';
    END IF;
END
$$;

-- Permisos del rol de migración sobre la base de datos y esquema
GRANT CONNECT ON DATABASE postgres TO yokai_migrator;
GRANT ALL ON SCHEMA public TO yokai_migrator;

-- Permisos de conexión para el rol de aplicación
GRANT CONNECT ON DATABASE postgres TO yokai_app;
GRANT USAGE ON SCHEMA public TO yokai_app;
