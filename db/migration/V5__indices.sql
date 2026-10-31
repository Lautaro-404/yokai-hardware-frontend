-- ============================================================================
-- V5__indices.sql
-- Yokai Hardware E-Commerce - Índices de Alto Rendimiento
-- Motor: PostgreSQL 15+
-- ============================================================================

-- Habilitación de extensión para búsqueda difusa (trigramas) sobre nombres de catálogo
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Catálogo facetado: Optimiza filtrado combinado por categoría y marca, ordenado por precio en productos activos
CREATE INDEX idx_producto_catalogo_facetado 
    ON producto (categoria_id, marca_id, precio) 
    WHERE activo;

-- 2. Paginación y ordenamiento: Soporta keyset pagination eficiente sobre catálogo activo ordenado por precio
CREATE INDEX idx_producto_precio_id 
    ON producto (precio, id) 
    WHERE activo;

-- 3. Panel de administración - Stock crítico: Índice parcial ultra-compacto para listar productos que requieren reposición
CREATE INDEX idx_producto_stock_bajo 
    ON producto (stock) 
    WHERE activo AND stock <= stock_minimo;

-- 4. Motor de compatibilidad / Búsqueda JSONB: Índice GIN jsonb_path_ops para queries de inclusión (@>) sobre specs
CREATE INDEX idx_producto_especificaciones_gin 
    ON producto USING gin (especificaciones jsonb_path_ops);

-- 5. Motor de compatibilidad - Socket: B-tree funcional para matching instantáneo de socket entre CPU y Motherboard
CREATE INDEX idx_producto_spec_socket 
    ON producto (((especificaciones->>'socket'))) 
    WHERE activo AND especificaciones ? 'socket';

-- 6. Búsqueda por texto: Trigram index para autocompletado y búsqueda flexible (LIKE/ILIKE '%termino%') en el catálogo
CREATE INDEX idx_producto_nombre_trgm 
    ON producto USING gin (nombre gin_trgm_ops);

-- 7. Historial de compras cliente: Permite recuperar las órdenes del usuario autenticado ordenadas de la más reciente a la más antigua
CREATE INDEX idx_pedido_usuario_fecha 
    ON pedido (usuario_id, fecha DESC);

-- 8. Panel de administración - Pedidos por estado: Agiliza la gestión de despacho filtrando por estado y antigüedad
CREATE INDEX idx_pedido_estado_fecha 
    ON pedido (estado, fecha DESC);

-- 9. Índices sobre claves foráneas en tablas de detalle para evitar bloqueos y table scans en JOINs
CREATE INDEX idx_detalle_pedido_pedido_id 
    ON detalle_pedido (pedido_id);

CREATE INDEX idx_detalle_pedido_producto_id 
    ON detalle_pedido (producto_id);

CREATE INDEX idx_carrito_item_producto_id 
    ON carrito_item (producto_id);
