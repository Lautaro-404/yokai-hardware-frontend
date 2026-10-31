-- ============================================================================
-- V6__validacion_especificaciones.sql
-- Yokai Hardware E-Commerce - Funciones y Triggers de Integridad
-- Motor: PostgreSQL 15+
-- ============================================================================

-- 1. Función genérica para actualización automática de timestamps de modificación
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de actualización de updated_at
CREATE TRIGGER trg_usuario_updated_at
    BEFORE UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trg_producto_updated_at
    BEFORE UPDATE ON producto
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trg_carrito_item_updated_at
    BEFORE UPDATE ON carrito_item
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trg_pedido_updated_at
    BEFORE UPDATE ON pedido
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- 2. Función de validación de especificaciones técnicas según categoría para el CompatibilidadEngine
CREATE OR REPLACE FUNCTION validar_especificaciones_producto()
RETURNS TRIGGER AS $$
DECLARE
    v_categoria_nombre VARCHAR(50);
    v_specs JSONB;
BEGIN
    SELECT nombre INTO v_categoria_nombre FROM categoria WHERE id = NEW.categoria_id;
    v_specs := NEW.especificaciones;

    -- Validación según la categoría del producto
    CASE
        -- GPU / Oni
        WHEN v_categoria_nombre = 'Oni' OR v_categoria_nombre ILIKE '%GPU%' OR v_categoria_nombre ILIKE '%Placa de Video%' THEN
            IF NOT (v_specs ? 'tdp_w' AND v_specs ? 'length_mm') THEN
                RAISE EXCEPTION 'GPU (Oni) requiere campos "tdp_w" y "length_mm" en especificaciones JSONB. SKU: %', NEW.sku;
            END IF;
            IF NOT (jsonb_typeof(v_specs->'tdp_w') = 'number' AND jsonb_typeof(v_specs->'length_mm') = 'number') THEN
                RAISE EXCEPTION '"tdp_w" y "length_mm" deben ser valores numéricos en GPU. SKU: %', NEW.sku;
            END IF;

        -- CPU / Kitsune
        WHEN v_categoria_nombre = 'Kitsune' OR v_categoria_nombre ILIKE '%CPU%' OR v_categoria_nombre ILIKE '%Procesador%' THEN
            IF NOT (v_specs ? 'socket' AND v_specs ? 'tdp_w') THEN
                RAISE EXCEPTION 'CPU (Kitsune) requiere campos "socket" y "tdp_w" en especificaciones JSONB. SKU: %', NEW.sku;
            END IF;
            IF NOT (jsonb_typeof(v_specs->'tdp_w') = 'number') THEN
                RAISE EXCEPTION '"tdp_w" debe ser numérico en CPU. SKU: %', NEW.sku;
            END IF;

        -- Placas Madre / Motherboards
        WHEN v_categoria_nombre ILIKE '%Motherboard%' OR v_categoria_nombre ILIKE '%Placa Madre%' THEN
            IF NOT (v_specs ? 'socket') THEN
                RAISE EXCEPTION 'Placa Madre requiere el campo "socket" en especificaciones JSONB. SKU: %', NEW.sku;
            END IF;

        -- Fuentes de poder / PSU
        WHEN v_categoria_nombre ILIKE '%Fuente%' OR v_categoria_nombre ILIKE '%PSU%' THEN
            IF NOT (v_specs ? 'watts') THEN
                RAISE EXCEPTION 'Fuente de poder requiere el campo "watts" en especificaciones JSONB. SKU: %', NEW.sku;
            END IF;
            IF NOT (jsonb_typeof(v_specs->'watts') = 'number') THEN
                RAISE EXCEPTION '"watts" debe ser numérico en Fuentes. SKU: %', NEW.sku;
            END IF;

        -- Gabinetes
        WHEN v_categoria_nombre ILIKE '%Gabinete%' OR v_categoria_nombre ILIKE '%Case%' THEN
            IF NOT (v_specs ? 'max_gpu_mm') THEN
                RAISE EXCEPTION 'Gabinete requiere el campo "max_gpu_mm" en especificaciones JSONB. SKU: %', NEW.sku;
            END IF;
            IF NOT (jsonb_typeof(v_specs->'max_gpu_mm') = 'number') THEN
                RAISE EXCEPTION '"max_gpu_mm" debe ser numérico en Gabinete. SKU: %', NEW.sku;
            END IF;

        ELSE
            -- Otras categorías (RAM Tengu, Almacenamiento, etc.) no bloquean validaciones críticas del motor
            NULL;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_especificaciones_producto
    BEFORE INSERT OR UPDATE OF especificaciones, categoria_id ON producto
    FOR EACH ROW
    EXECUTE FUNCTION validar_especificaciones_producto();
