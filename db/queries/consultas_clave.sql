-- ============================================================================
-- db/queries/consultas_clave.sql
-- Yokai Hardware E-Commerce - Consultas SQL Críticas de Negocio
-- Motor: PostgreSQL 15+
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CATÁLOGO FACETADO CON FILTROS DINÁMICOS Y PAGINACIÓN KEYSET
-- Optimización: Utiliza idx_producto_catalogo_facetado (categoria_id, marca_id, precio)
-- y keyset pagination (precio > :ultimo_precio OR (precio = :ultimo_precio AND id > :ultimo_id))
-- para evitar el costo de OFFSET O(N) en catálogos masivos.
-- ----------------------------------------------------------------------------
SELECT 
    p.id,
    p.sku,
    p.nombre,
    p.precio,
    p.stock,
    p.estado_stock,
    c.nombre AS categoria,
    m.nombre AS marca,
    p.especificaciones,
    p.imagen_url,
    p.destacado
FROM producto p
JOIN categoria c ON p.categoria_id = c.id
JOIN marca m ON p.marca_id = m.id
WHERE p.activo = true
  AND (:categoria_id IS NULL OR p.categoria_id = :categoria_id)
  AND (:marca_id IS NULL OR p.marca_id = :marca_id)
  AND (:precio_min IS NULL OR p.precio >= :precio_min)
  AND (:precio_max IS NULL OR p.precio <= :precio_max)
  AND (:estado_stock IS NULL OR p.estado_stock = :estado_stock)
  -- Keyset pagination condition:
  AND (:ultimo_precio IS NULL OR (p.precio > :ultimo_precio OR (p.precio = :ultimo_precio AND p.id > :ultimo_id)))
ORDER BY p.precio ASC, p.id ASC
LIMIT 12;


-- ----------------------------------------------------------------------------
-- 2. DESCUENTO ATÓMICO ANTI-OVERSELLING (CHECKOUT / TRANSICIÓN A 'PAGADO')
-- Decisión aprobada: UPDATE condicional que descuenta inventario en una única
-- instrucción atómica a nivel de motor.
-- Si rows_affected == 0, significa que no hay stock suficiente o el producto está inactivo.
-- Esto gatilla rollback total inmediato de la transacción en Spring Boot.
-- ----------------------------------------------------------------------------
-- NOTA: La aplicación DEBE ordenar los IDs de los productos a descontar de forma ascendente
-- (ORDER BY producto_id ASC) antes de ejecutar para inmunizarse contra deadlocks.
UPDATE producto 
SET stock = stock - :cantidad_solicitada,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :producto_id
  AND activo = true
  AND stock >= :cantidad_solicitada;


-- ----------------------------------------------------------------------------
-- 3. PANEL DE ADMINISTRACIÓN: ALERTA TEMPRANA DE STOCK BAJO O QUIEBRE
-- Optimización: Utiliza el índice parcial ultra-compacto idx_producto_stock_bajo
-- (stock) WHERE activo AND stock <= stock_minimo. Índice de solo 몇 KB en RAM.
-- ----------------------------------------------------------------------------
SELECT 
    p.id,
    p.sku,
    p.nombre,
    c.nombre AS categoria,
    m.nombre AS marca,
    p.stock,
    p.stock_minimo,
    p.estado_stock,
    p.precio
FROM producto p
JOIN categoria c ON p.categoria_id = c.id
JOIN marca m ON p.marca_id = m.id
WHERE p.activo = true
  AND p.stock <= p.stock_minimo
ORDER BY p.stock ASC, p.stock_minimo DESC;


-- ----------------------------------------------------------------------------
-- 4. HISTORIAL DE PEDIDOS POR USUARIO AUTENTICADO
-- Optimización: Index Scan hacia atrás sobre idx_pedido_usuario_fecha (usuario_id, fecha DESC).
-- ----------------------------------------------------------------------------
SELECT 
    p.id_pedido,
    p.fecha,
    p.estado,
    p.total,
    p.metodo_pago,
    p.direccion_envio,
    jsonb_agg(
        jsonb_build_object(
            'detalle_id', dp.id_detalle,
            'producto_id', prod.id,
            'nombre', prod.nombre,
            'imagen_url', prod.imagen_url,
            'cantidad', dp.cantidad,
            'precio_unitario', dp.precio_unit,
            'subtotal', (dp.cantidad * dp.precio_unit)
        ) ORDER BY dp.id_detalle ASC
    ) AS detalles
FROM pedido p
JOIN detalle_pedido dp ON p.id_pedido = dp.pedido_id
JOIN producto prod ON dp.producto_id = prod.id
WHERE p.usuario_id = :usuario_id
GROUP BY p.id_pedido, p.fecha, p.estado, p.total, p.metodo_pago, p.direccion_envio
ORDER BY p.fecha DESC;


-- ----------------------------------------------------------------------------
-- 5. PANEL DE ADMINISTRACIÓN: PEDIDOS POR ESTADO Y FECHA
-- Optimización: Utiliza idx_pedido_estado_fecha (estado, fecha DESC).
-- ----------------------------------------------------------------------------
SELECT 
    p.id_pedido,
    u.id AS usuario_id,
    u.nombre AS cliente_nombre,
    u.email AS cliente_email,
    p.fecha,
    p.estado,
    p.total,
    p.direccion_envio,
    COUNT(dp.id_detalle) AS cantidad_items
FROM pedido p
JOIN usuario u ON p.usuario_id = u.id
JOIN detalle_pedido dp ON p.id_pedido = dp.pedido_id
WHERE (:filtro_estado IS NULL OR p.estado = :filtro_estado)
GROUP BY p.id_pedido, u.id, u.nombre, u.email, p.fecha, p.estado, p.total, p.direccion_envio
ORDER BY p.fecha DESC
LIMIT 50;


-- ----------------------------------------------------------------------------
-- 6. MOTOR DE COMPATIBILIDAD: BÚSQUEDA Y VALIDACIÓN DE COMPONENTES
-- a) Búsqueda instantánea de procesadores o placas madre por Socket exacto
-- Optimización: Utiliza índice de expresión B-tree idx_producto_spec_socket
-- ----------------------------------------------------------------------------
SELECT id, sku, nombre, precio, stock, especificaciones
FROM producto
WHERE activo = true
  AND categoria_id = (SELECT id FROM categoria WHERE nombre = 'Kitsune')
  AND (especificaciones->>'socket') = :socket_objetivo;

-- b) Validación de capacidad de Fuente de Poder (PSU) vs Consumo estimado (TDP)
-- Fórmula: psu.watts >= (cpu.tdp + gpu.tdp) * 1.25
SELECT 
    psu.id AS psu_id,
    psu.nombre AS psu_nombre,
    (psu.especificaciones->>'watts')::INTEGER AS watts_nominales,
    (:cpu_tdp_w + :gpu_tdp_w) AS consumo_estimado_w,
    ((:cpu_tdp_w + :gpu_tdp_w) * 1.25)::NUMERIC(10,2) AS watts_recomendados_con_margen,
    CASE 
        WHEN (psu.especificaciones->>'watts')::INTEGER >= ((:cpu_tdp_w + :gpu_tdp_w) * 1.25) THEN true 
        ELSE false 
    END AS es_compatible
FROM producto psu
WHERE psu.id = :psu_id
  AND psu.categoria_id = (SELECT id FROM categoria WHERE nombre = 'Fuentes de Poder');
