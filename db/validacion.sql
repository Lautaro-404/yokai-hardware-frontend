-- ============================================================================
-- db/validacion.sql
-- Yokai Hardware E-Commerce - Script Integral de Validación Post-Despliegue
-- Motor: PostgreSQL 15+
-- ============================================================================

\echo '===================================================================='
\echo '1. CONTEO DE TABLAS DEL ESQUEMA PUBLIC'
\echo '===================================================================='
SELECT 
    table_name,
    (xpath('/row/cnt/text()', xml_count))[1]::text::integer as total_filas
FROM (
    SELECT 
        table_name, 
        query_to_xml(format('SELECT COUNT(*) as cnt FROM %I', table_name), false, true, '') as xml_count
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
) sub
ORDER BY table_name;


\echo '===================================================================='
\echo '2. INTEGRIDAD REFERENCIAL (CLAVES FORÁNEAS Y POLÍTICAS ON DELETE/UPDATE)'
\echo '===================================================================='
SELECT 
    tc.table_name AS tabla_origen,
    kcu.column_name AS columna_fk,
    ccu.table_name AS tabla_destino,
    ccu.column_name AS columna_pk,
    rc.update_rule AS al_actualizar,
    rc.delete_rule AS al_eliminar
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;


\echo '===================================================================='
\echo '3. RESTRICCIONES CHECK Y UNIQUE REGISTRADAS'
\echo '===================================================================='
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'UNIQUE')
  AND NOT tc.constraint_name LIKE '%_not_null'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;


\echo '===================================================================='
\echo '4. ÍNDICES DE RENDIMIENTO (B-TREE, GIN, FUNCIONALES Y PARCIALES)'
\echo '===================================================================='
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


\echo '===================================================================='
\echo '5. VALIDACIÓN DE DATOS DEL SEED (USUARIOS, ROLES Y PERMISOS)'
\echo '===================================================================='
SELECT id, nombre, email, rol, activo, created_at 
FROM usuario 
ORDER BY id;


\echo '===================================================================='
\echo '6. VALIDACIÓN DE PRODUCTOS Y ESTADOS CALCULADOS (GENERATED STORED)'
\echo '===================================================================='
SELECT 
    p.id,
    p.sku,
    p.nombre,
    c.nombre AS categoria,
    m.nombre AS marca,
    p.precio,
    p.stock,
    p.stock_minimo,
    p.estado_stock
FROM producto p
JOIN categoria c ON p.categoria_id = c.id
JOIN marca m ON p.marca_id = m.id
ORDER BY p.id;


\echo '===================================================================='
\echo '7. VALIDACIÓN DE ESPECIFICACIONES JSONB PARA EL MOTOR DE COMPATIBILIDAD'
\echo '===================================================================='
SELECT 
    p.sku,
    c.nombre AS categoria,
    p.especificaciones->>'socket' AS socket,
    p.especificaciones->>'tdp_w' AS tdp_w,
    p.especificaciones->>'watts' AS psu_watts,
    p.especificaciones->>'length_mm' AS gpu_length_mm,
    p.especificaciones->>'max_gpu_mm' AS case_max_gpu_mm
FROM producto p
JOIN categoria c ON p.categoria_id = c.id
WHERE p.especificaciones ? 'socket' 
   OR p.especificaciones ? 'tdp_w' 
   OR p.especificaciones ? 'watts' 
   OR p.especificaciones ? 'length_mm' 
   OR p.especificaciones ? 'max_gpu_mm'
ORDER BY c.nombre, p.sku;


\echo '===================================================================='
\echo '8. VALIDACIÓN DE PEDIDOS HISTÓRICOS Y DETALLE CONGELADO'
\echo '===================================================================='
SELECT 
    p.id_pedido,
    u.email AS cliente,
    p.fecha,
    p.estado,
    p.total,
    COUNT(dp.id_detalle) AS lineas_detalle,
    SUM(dp.cantidad * dp.precio_unit) AS total_calculado_lineas
FROM pedido p
JOIN usuario u ON p.usuario_id = u.id
JOIN detalle_pedido dp ON p.id_pedido = dp.pedido_id
GROUP BY p.id_pedido, u.email, p.fecha, p.estado, p.total
ORDER BY p.id_pedido;
