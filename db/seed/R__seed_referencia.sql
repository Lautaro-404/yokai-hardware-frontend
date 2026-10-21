-- ============================================================================
-- R__seed_referencia.sql
-- Yokai Hardware E-Commerce - Datos Semilla de Referencia (Idempotente)
-- Categorías temáticas y Marcas oficiales
-- Motor: PostgreSQL 15+
-- ============================================================================

-- Categorías temáticas Yokai y estándar de hardware
INSERT INTO categoria (nombre, descripcion) VALUES
    ('Oni', 'Tarjetas gráficas dedicadas de alto rendimiento inspiradas en la potencia y furia del ogro Oni.'),
    ('Kitsune', 'Procesadores veloces e inteligentes con tecnología avanzada, regidos por el espíritu del zorro Kitsune.'),
    ('Tengu', 'Módulos de memoria RAM de alta frecuencia y baja latencia, veloces como los guerreros cuervo Tengu.'),
    ('Placas Madre', 'Placas base y chipsets entusiastas para socket AM5 y LGA1700 con soporte PCIe 5.0.'),
    ('Fuentes de Poder', 'Fuentes ATX 3.0 con certificación 80 Plus Gold/Platinum y conectores nativos 12VHPWR.'),
    ('Gabinetes', 'Chasis de alto flujo de aire con vidrio templado y capacidad para radiadores y GPUs de gran porte.'),
    ('Almacenamiento', 'Unidades de estado sólido M.2 NVMe PCIe 4.0/5.0 con velocidades de lectura extrema.')
ON CONFLICT (nombre) DO UPDATE 
SET descripcion = EXCLUDED.descripcion;

-- Marcas líderes de la industria
INSERT INTO marca (nombre) VALUES
    ('ASUS'),
    ('AMD'),
    ('Intel'),
    ('Corsair'),
    ('Gigabyte'),
    ('Kingston'),
    ('Seasonic'),
    ('Lian Li'),
    ('MSI'),
    ('Western Digital')
ON CONFLICT (nombre) DO NOTHING;
