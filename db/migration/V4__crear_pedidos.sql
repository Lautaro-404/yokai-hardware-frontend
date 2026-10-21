-- ============================================================================
-- V4__crear_pedidos.sql
-- Yokai Hardware E-Commerce - Módulo de Pedidos y Líneas de Detalle
-- Motor: PostgreSQL 15+
-- ============================================================================

CREATE TABLE pedido (
    id_pedido BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    fecha TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_PAGO',
    total NUMERIC(12, 2) NOT NULL,
    direccion_envio TEXT NOT NULL,
    metodo_pago VARCHAR(50) NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Integridad referencial con usuario (no se puede borrar un usuario con historial de compras)
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario(id) ON DELETE RESTRICT ON UPDATE NO ACTION,

    -- Ciclo de vida y máquina de estados lineal de pedidos
    CONSTRAINT chk_pedido_estado CHECK (
        estado IN ('PENDIENTE_PAGO', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO')
    ),

    -- Importe total no negativo
    CONSTRAINT chk_pedido_total CHECK (total >= 0)
);

CREATE TABLE detalle_pedido (
    id_detalle BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unit NUMERIC(12, 2) NOT NULL, -- Precio congelado al momento exacto de la compra
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- La eliminación de un pedido arrastra sus líneas de detalle (CASCADE)
    CONSTRAINT fk_detalle_pedido_cabecera FOREIGN KEY (pedido_id)
        REFERENCES pedido(id_pedido) ON DELETE CASCADE ON UPDATE NO ACTION,

    -- Protección contable: no se puede borrar un producto si figura en detalles de órdenes históricas
    CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (producto_id)
        REFERENCES producto(id) ON DELETE RESTRICT ON UPDATE NO ACTION,

    -- Restricciones de validación aritmética
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_precio_unit CHECK (precio_unit >= 0),

    -- Un producto no puede repetirse en varias líneas de un mismo pedido
    CONSTRAINT uq_detalle_pedido_producto UNIQUE (pedido_id, producto_id)
);

COMMENT ON TABLE pedido IS 'Cabeceras de órdenes de compra con control de estado de ciclo de vida.';
COMMENT ON TABLE detalle_pedido IS 'Líneas de pedido con inmutabilidad de precios históricos unitarios.';
COMMENT ON COLUMN detalle_pedido.precio_unit IS 'Copia congelada del precio del producto al momento del checkout (inmutable frente a cambios de catálogo).';
