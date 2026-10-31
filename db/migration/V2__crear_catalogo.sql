-- ============================================================================
-- V2__crear_catalogo.sql
-- Yokai Hardware E-Commerce - Módulo de Catálogo de Productos
-- Motor: PostgreSQL 15+
-- ============================================================================

CREATE TABLE categoria (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marca (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE producto (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    precio NUMERIC(12, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    -- Columna generada almacenada (PostgreSQL 12+) para cálculo automático de estado de inventario
    estado_stock VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN stock = 0 THEN 'SIN_STOCK'
            WHEN stock <= stock_minimo THEN 'ULTIMAS_UNIDADES'
            ELSE 'EN_STOCK'
        END
    ) STORED,
    categoria_id BIGINT NOT NULL,
    marca_id BIGINT NOT NULL,
    especificaciones JSONB NOT NULL DEFAULT '{}'::jsonb,
    imagen_url TEXT NULL,
    destacado BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Claves foráneas con política estricta de protección de datos históricos
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id)
        REFERENCES categoria(id) ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT fk_producto_marca FOREIGN KEY (marca_id)
        REFERENCES marca(id) ON DELETE RESTRICT ON UPDATE NO ACTION,

    -- Restricciones de integridad de dominio
    CONSTRAINT chk_producto_precio CHECK (precio > 0),
    CONSTRAINT chk_producto_stock CHECK (stock >= 0),
    CONSTRAINT chk_producto_stock_minimo CHECK (stock_minimo >= 0),
    CONSTRAINT chk_producto_specs_object CHECK (jsonb_typeof(especificaciones) = 'object')
);

COMMENT ON TABLE categoria IS 'Categorías temáticas de hardware (Oni para GPUs, Kitsune para CPUs, Tengu para RAM, etc.).';
COMMENT ON TABLE marca IS 'Fabricantes y ensambladoras de hardware (ASUS, AMD, Intel, Corsair, etc.).';
COMMENT ON TABLE producto IS 'Catálogo central de componentes con soporte para especificaciones JSONB y soft delete.';
COMMENT ON COLUMN producto.estado_stock IS 'Estado de disponibilidad generado automáticamente en disco en función de stock y stock_minimo.';
COMMENT ON COLUMN producto.especificaciones IS 'Atributos técnicos semiestructurados en formato JSONB para el motor de compatibilidad.';
