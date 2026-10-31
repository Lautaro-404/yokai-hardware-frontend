-- ============================================================================
-- R__seed_referencia.sql
-- Yokai Hardware E-Commerce - Datos Semilla de Referencia (Idempotente)
-- Categorías temáticas y Marcas oficiales
-- Motor: PostgreSQL 15+
-- ============================================================================

-- Categorías temáticas Yokai y estándar de hardware con metadatos visuales
INSERT INTO categoria (nombre, subtitulo, kanji, icono, acento, descripcion) VALUES
    ('Kitsune', 'Procesadores', '狐', 'memory', 'gold', 'Intel Core & AMD Ryzen de última generación impulsados por la astucia del espíritu Kitsune.'),
    ('Oni', 'Placas de Video', '鬼', 'sports_esports', 'vermilion', 'Tarjetas gráficas dedicadas de alto rendimiento inspiradas en la potencia y furia del ogro Oni.'),
    ('Tengu', 'Memorias RAM', '天狗', 'speed', 'gold', 'Módulos de memoria RAM DDR5 y DDR4 veloces y de baja latencia como los guerreros cuervo Tengu.'),
    ('Tanuki', 'Almacenamiento', '狸', 'save', 'pine', 'Unidades de estado sólido SSD M.2 NVMe Gen4/Gen5 con velocidades de lectura extrema.'),
    ('Kappa', 'Fuentes de Poder', '河童', 'bolt', 'gold', 'Fuentes de poder modulares ATX 3.0 con certificación 80 Plus Gold y conectores 12VHPWR.'),
    ('Yurei', 'Gabinetes', '幽霊', 'in_home_mode', 'gold', 'Chasis Mid y Full Tower de alto flujo de aire con vidrio templado panorámico.'),
    ('Placas Madre', 'Placas Madre', '母', 'developer_board', 'gold', 'Placas base y chipsets entusiastas para socket AM5 y LGA1700 con soporte PCIe 5.0.'),
    ('Almacenamiento', 'Almacenamiento', '狸', 'save', 'pine', 'Unidades de estado sólido M.2 NVMe PCIe 4.0/5.0 con velocidades de lectura extrema.'),
    ('Fuentes de Poder', 'Fuentes de Poder', '河童', 'bolt', 'gold', 'Fuentes ATX 3.0 con certificación 80 Plus Gold/Platinum y conectores nativos 12VHPWR.'),
    ('Gabinetes', 'Gabinetes', '幽霊', 'in_home_mode', 'gold', 'Chasis de alto flujo de aire con vidrio templado y capacidad para radiadores y GPUs de gran porte.')
ON CONFLICT (nombre) DO UPDATE 
SET subtitulo = EXCLUDED.subtitulo,
    kanji = EXCLUDED.kanji,
    icono = EXCLUDED.icono,
    acento = EXCLUDED.acento,
    descripcion = EXCLUDED.descripcion;

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
    ('Western Digital'),
    ('G.Skill'),
    ('Samsung'),
    ('WD Black'),
    ('XPG'),
    ('Cooler Master'),
    ('Hyte')
ON CONFLICT (nombre) DO NOTHING;
