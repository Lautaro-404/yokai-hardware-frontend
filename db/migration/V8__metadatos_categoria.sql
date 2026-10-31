-- ============================================================================
-- V8__metadatos_categoria.sql
-- Yokai Hardware E-Commerce - Metadatos Visuales y Temáticos de Categorías
-- Motor: PostgreSQL 15+
-- ============================================================================

ALTER TABLE categoria
    ADD COLUMN IF NOT EXISTS subtitulo VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS kanji VARCHAR(10) NULL,
    ADD COLUMN IF NOT EXISTS icono VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS acento VARCHAR(20) NULL DEFAULT 'gold';

COMMENT ON COLUMN categoria.subtitulo IS 'Denominación convencional de hardware (Procesadores, Placas de Video, etc.).';
COMMENT ON COLUMN categoria.kanji IS 'Ideograma kanji temático asociado al espíritu Yokai.';
COMMENT ON COLUMN categoria.icono IS 'Identificador de icono Material Symbols.';
COMMENT ON COLUMN categoria.acento IS 'Color temático de acento visual (gold, vermilion, pine).';
