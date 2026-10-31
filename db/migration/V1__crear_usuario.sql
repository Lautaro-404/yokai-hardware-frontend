-- ============================================================================
-- V1__crear_usuario.sql
-- Yokai Hardware E-Commerce - Módulo de Identidad y Acceso
-- Motor: PostgreSQL 15+
-- ============================================================================

CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Almacena hash BCrypt ($2a$, $2b$ o $2y$)
    rol VARCHAR(20) NOT NULL DEFAULT 'CLIENTE',
    direccion TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricción de dominio de roles del sistema
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('CLIENTE', 'ADMIN')),
    -- Validación básica de sintaxis de email
    CONSTRAINT chk_usuario_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índice único case-insensitive para garantizar emails irrepetibles sin depender del casing de entrada
CREATE UNIQUE INDEX uq_usuario_email_lower ON usuario (LOWER(email));

COMMENT ON TABLE usuario IS 'Usuarios del sistema (clientes y administradores) para autenticación JWT stateless y RBAC.';
COMMENT ON COLUMN usuario.password IS 'Hash de contraseña generado exclusivamente mediante algoritmo BCrypt.';
COMMENT ON COLUMN usuario.rol IS 'Rol del usuario para autorización RBAC: CLIENTE o ADMIN.';
