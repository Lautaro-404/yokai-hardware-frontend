-- ============================================================================
-- V9__quitar_estado_stock_persistido.sql
-- El estado de stock ("En stock", "Últimas unidades", "Sin stock") se calcula en
-- la aplicación a partir de stock y stock_minimo; no se guarda en la base.
-- ============================================================================

ALTER TABLE producto DROP COLUMN estado_stock;
