-- ============================================================================
-- V7__permisos_app.sql
-- Yokai Hardware E-Commerce - Concesión de Privilegios de Mínimo Acceso
-- Motor: PostgreSQL 15+
-- ============================================================================

DO $$
BEGIN
    -- Se verifica la existencia del rol de aplicación antes de conceder privilegios
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'yokai_app') THEN
        -- Acceso DML sobre todas las tablas actuales del esquema public
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO yokai_app;

        -- Acceso sobre las secuencias para generación de PKs (BIGSERIAL)
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yokai_app;

        -- Configuración de privilegios por defecto para tablas y secuencias futuras
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO yokai_app;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO yokai_app;

        RAISE NOTICE 'Privilegios de mínimo acceso concedidos exitosamente al rol yokai_app.';
    ELSE
        RAISE NOTICE 'Aviso: El rol yokai_app no existe en esta instancia; omitiendo concesión automática.';
    END IF;
END
$$;
