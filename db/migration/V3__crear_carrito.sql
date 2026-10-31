-- ============================================================================
-- V3__crear_carrito.sql
-- Yokai Hardware E-Commerce - Módulo de Carrito de Compras Persistente
-- Motor: PostgreSQL 15+
-- ============================================================================

CREATE TABLE carrito_item (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Si un usuario es eliminado, se limpian sus ítems de carrito (CASCADE)
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario(id) ON DELETE CASCADE ON UPDATE NO ACTION,

    -- Un producto no puede ser borrado físicamente si está en algún carrito (RESTRICT)
    CONSTRAINT fk_carrito_producto FOREIGN KEY (producto_id)
        REFERENCES producto(id) ON DELETE RESTRICT ON UPDATE NO ACTION,

    -- Solo cantidades estrictamente positivas
    CONSTRAINT chk_carrito_cantidad CHECK (cantidad > 0),

    -- Un usuario no puede tener filas duplicadas para el mismo producto en su carrito
    CONSTRAINT uq_carrito_usuario_producto UNIQUE (usuario_id, producto_id)
);

COMMENT ON TABLE carrito_item IS 'Ítems de carritos persistentes sincronizados desde LocalStorage tras la autenticación.';
COMMENT ON CONSTRAINT uq_carrito_usuario_producto ON carrito_item IS 'Garantiza consolidación de cantidad en una sola fila por producto y usuario.';
