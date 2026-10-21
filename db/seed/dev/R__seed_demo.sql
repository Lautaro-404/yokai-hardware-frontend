-- ============================================================================
-- db/seed/dev/R__seed_demo.sql
-- Yokai Hardware E-Commerce - Datos de Prueba y Entorno de Desarrollo (Idempotente)
-- Motor: PostgreSQL 15+
-- ============================================================================

-- 1. USUARIOS DE PRUEBA
-- Contraseñas en claro documentadas para el equipo de desarrollo:
-- admin@yokaihardware.com.ar      -> Admin123!
-- cliente@yokaihardware.com.ar    -> Cliente123!
-- abril.dev@yokaihardware.com.ar  -> Cliente123!
INSERT INTO usuario (id, nombre, email, password, rol, direccion, activo) VALUES
    (1, 'Administrador Yokai', 'admin@yokaihardware.com.ar', '$2a$10$vI8aWBnW3fID.ZQ4/ZO1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'ADMIN', 'Av. Central 100, San Rafael, Mendoza', true),
    (2, 'Abril Cliente', 'cliente@yokaihardware.com.ar', '$2a$10$K9rZf5V0.GzM8y1c8i3i8O3O0G/Xy6u5GvG9h7K4n3n5v8K2l1m4O', 'CLIENTE', 'Av. San Martín 850, San Rafael, Mendoza (CP 5600)', true),
    (3, 'Tatsuya Tester', 'abril.dev@yokaihardware.com.ar', '$2a$10$K9rZf5V0.GzM8y1c8i3i8O3O0G/Xy6u5GvG9h7K4n3n5v8K2l1m4O', 'CLIENTE', 'Hipólito Yrigoyen 1420, San Rafael, Mendoza', true)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol,
    direccion = EXCLUDED.direccion;

-- Sincronizar secuencia de usuario
SELECT setval('usuario_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuario));


-- 2. CATÁLOGO DE PRODUCTOS (24 ítems realistas y matemáticamente coherentes con el CompatibilidadEngine)
-- IDs fijos para reproducibilidad del seed
INSERT INTO producto (id, sku, nombre, descripcion, precio, stock, stock_minimo, categoria_id, marca_id, especificaciones, imagen_url, destacado, activo) VALUES
    -- ------------------------------------------------------------------------
    -- ONI (GPUs)
    -- ------------------------------------------------------------------------
    (1, 'GPU-RTX-4070TIS-STRIX', 'ASUS ROG Strix GeForce RTX 4070 Ti SUPER OC 16GB', 
     'Arquitectura NVIDIA Ada Lovelace con sistema térmico de triple ventilador Axial-tech y entrega de energía digital de grado entusiasta.',
     1420000.00, 3, 5, 
     (SELECT id FROM categoria WHERE nombre = 'Oni'), 
     (SELECT id FROM marca WHERE nombre = 'ASUS'),
     '{"tdp_w": 285, "length_mm": 336, "vram_gb": 16, "memoria_tipo": "GDDR6X", "power_connector": "16-pin 12VHPWR", "slots": 3.15}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBkRGhRL2GKFiI-yK5c6SZhfFw8EjJjsBwXLzT3MIN3beGdo41DB1dBJPQeXq0ufvovEZ6ddJx9kAaUgJxEm0bE0fFW-HE4eqKOoTEem-rXbyT7mOyvQ9z4tLfoGHUd5-Sl0AxuNZDLaksXW1g5QKdW7MsD3zFRlpP7nrsdLZFWxfNwfIIKiWGFslzKYeeRPLxDsrePcNIlEeDuqoU_at5OEUi6Wm5parKQeio-W6bYSiGC9oekPWoqCA',
     true, true),

    (2, 'GPU-RTX-4090-AORUS', 'Gigabyte AORUS GeForce RTX 4090 Master 24GB',
     'El titan definitivo del gaming en 4K. Máxima disipación con cámara de vapor y pantalla LCD Edge View integrada.',
     2850000.00, 1, 2, 
     (SELECT id FROM categoria WHERE nombre = 'Oni'), 
     (SELECT id FROM marca WHERE nombre = 'Gigabyte'),
     '{"tdp_w": 450, "length_mm": 358.5, "vram_gb": 24, "memoria_tipo": "GDDR6X", "power_connector": "16-pin 12VHPWR", "slots": 3.75}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuAtZIk0WHgpnXUd0USS4iuobEfWesDESM1UF-O-4gAB9UPJV1_T9hhZ6r5jEAVZ7oDC4YY73CSDNIRl6CNbJIH1o5Mb-V_4wuuFJcPsYHedb35qQXVUMtLzlAdMWg8Gvy-rxrRsqQiBocBFb68CQgxFtRtDErFH8MfiXno8aa1ofL-4Hg0bC5MEKVIQtzB5nTTI5UuCS5I3kEmxNRAimeFsITtJhqh5ymHgZemxcLVHLPSlH9Ri8rIkQ',
     true, true),

    (3, 'GPU-RTX-4060-VENTUS', 'MSI GeForce RTX 4060 Ventus 2X Black 8GB OC',
     'Diseño dual fan compacto optimizado para gabinetes reducidos y gaming de alta fidelidad en 1080p con consumo ultra contenido.',
     465000.00, 15, 4, 
     (SELECT id FROM categoria WHERE nombre = 'Oni'), 
     (SELECT id FROM marca WHERE nombre = 'MSI'),
     '{"tdp_w": 115, "length_mm": 199, "vram_gb": 8, "memoria_tipo": "GDDR6", "power_connector": "8-pin PCIe", "slots": 2.0}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBkRGhRL2GKFiI-yK5c6SZhfFw8EjJjsBwXLzT3MIN3beGdo41DB1dBJPQeXq0ufvovEZ6ddJx9kAaUgJxEm0bE0fFW-HE4eqKOoTEem-rXbyT7mOyvQ9z4tLfoGHUd5-Sl0AxuNZDLaksXW1g5QKdW7MsD3zFRlpP7nrsdLZFWxfNwfIIKiWGFslzKYeeRPLxDsrePcNIlEeDuqoU_at5OEUi6Wm5parKQeio-W6bYSiGC9oekPWoqCA',
     false, true),

    (4, 'GPU-RX-7900XTX-TUF', 'ASUS TUF Gaming Radeon RX 7900 XTX OC 24GB',
     'Arquitectura AMD RDNA 3, condensadores de grado militar y certificación TUF para durabilidad inquebrantable.',
     1890000.00, 0, 3, -- SIN STOCK PARA TESTEAR REGLA
     (SELECT id FROM categoria WHERE nombre = 'Oni'), 
     (SELECT id FROM marca WHERE nombre = 'ASUS'),
     '{"tdp_w": 355, "length_mm": 353, "vram_gb": 24, "memoria_tipo": "GDDR6", "power_connector": "3x 8-pin PCIe", "slots": 3.63}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBc0XruKgt0lbQyzWbT7AjSy9YdUM6QbHpSedy4H400JKbCf7Lk2mhoR-idXS4B27n1HKJXzZf96pgmM9AlgJB12PSi2iJf23jMtx8pqxWp8SK-VaC-jsukRKuZfBIh4bzQ_iAcJUfCr4d7DO0F65Sy_GPtCdZgoQoAuZKySzznfuq0i43Kb5TkgGKSixuXICsK1slWAQTZAShNzCY7S4Fc45vjrTE0nuVJli5p8xmJOppQcOyh757J9w',
     false, true),

    -- ------------------------------------------------------------------------
    -- KITSUNE (CPUs)
    -- ------------------------------------------------------------------------
    (5, 'CPU-AMD-7800X3D', 'AMD Ryzen 7 7800X3D 5.0GHz AM5',
     'El procesador definitivo de gaming en el mundo con 104MB de caché total y tecnología 3D V-Cache sobre Socket AM5.',
     699999.00, 12, 4, 
     (SELECT id FROM categoria WHERE nombre = 'Kitsune'), 
     (SELECT id FROM marca WHERE nombre = 'AMD'),
     '{"socket": "AM5", "tdp_w": 120, "nucleos": 8, "hilos": 16, "base_ghz": 4.2, "boost_ghz": 5.0, "memoria_soportada": "DDR5"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBXDaLsJdOD1H0RELU4t3IWDVZyOpjHUd1usKMS5QOx7EgA447OWqgIg8JNsWkZBS-EYq5v7961TshM5q2lCHvwdE2_1JyucEddHOECXVUpVyNkjFYyksaBkr3RyY5Iew8tPKIvwaGeDRGX0bQjDiDz9dspfGyWRqYir6SAfU1Pga8N_21T6w1cY1HGRTfMOUbKourlYcWQS-Qtu9v2lkbR0HtX7Qc-Nfbs0xa5MiQg6-x7niyaVRHdow',
     true, true),

    (6, 'CPU-AMD-7950X', 'AMD Ryzen 9 7950X 5.7GHz AM5',
     'Monstruo de productividad y creación de contenido con 16 núcleos físicos y 32 hilos en arquitectura Zen 4.',
     880000.00, 6, 2, 
     (SELECT id FROM categoria WHERE nombre = 'Kitsune'), 
     (SELECT id FROM marca WHERE nombre = 'AMD'),
     '{"socket": "AM5", "tdp_w": 170, "nucleos": 16, "hilos": 32, "base_ghz": 4.5, "boost_ghz": 5.7, "memoria_soportada": "DDR5"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBXDaLsJdOD1H0RELU4t3IWDVZyOpjHUd1usKMS5QOx7EgA447OWqgIg8JNsWkZBS-EYq5v7961TshM5q2lCHvwdE2_1JyucEddHOECXVUpVyNkjFYyksaBkr3RyY5Iew8tPKIvwaGeDRGX0bQjDiDz9dspfGyWRqYir6SAfU1Pga8N_21T6w1cY1HGRTfMOUbKourlYcWQS-Qtu9v2lkbR0HtX7Qc-Nfbs0xa5MiQg6-x7niyaVRHdow',
     false, true),

    (7, 'CPU-INT-14700K', 'Intel Core i7-14700K 5.6GHz LGA1700',
     '20 núcleos híbridos (8P + 12E) con potencia descomunal para gaming y streaming simultáneo.',
     640000.00, 2, 4, -- STOCK BAJO (ÚLTIMAS UNIDADES)
     (SELECT id FROM categoria WHERE nombre = 'Kitsune'), 
     (SELECT id FROM marca WHERE nombre = 'Intel'),
     '{"socket": "LGA1700", "tdp_w": 253, "nucleos": 20, "hilos": 28, "base_ghz": 3.4, "boost_ghz": 5.6, "memoria_soportada": "DDR5/DDR4"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuAG1w6Ejp4tgTwCq2aZ8uUGxHvUPZC_WIROJrzToIM_Kh4Qaapd3xzXuIytQ9HriYvvWSxsVaWgsrI0elfyovS5OQHlQuYa8Wb2pHRqX4qpIvRjdNebTJtuzXjHo3MuLxqp8fNo9vzdgfX2SJYqblY0gmbnWRcivV1YIWhkfu-PQ_s1xLkTpcVJ0huYPYHz6KXMoj2HQLeolW-7ZIolKFNoXBQ6f0v5Dd4R4GtagTskG4r3iEAQi4azow',
     true, true),

    (8, 'CPU-INT-13400F', 'Intel Core i5-13400F 4.6GHz LGA1700',
     'Excelente balance de precio y prestaciones de 10 núcleos con un TDP eficiente de 65W.',
     295000.00, 10, 3, 
     (SELECT id FROM categoria WHERE nombre = 'Kitsune'), 
     (SELECT id FROM marca WHERE nombre = 'Intel'),
     '{"socket": "LGA1700", "tdp_w": 65, "nucleos": 10, "hilos": 16, "base_ghz": 2.5, "boost_ghz": 4.6, "memoria_soportada": "DDR5/DDR4"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuAG1w6Ejp4tgTwCq2aZ8uUGxHvUPZC_WIROJrzToIM_Kh4Qaapd3xzXuIytQ9HriYvvWSxsVaWgsrI0elfyovS5OQHlQuYa8Wb2pHRqX4qpIvRjdNebTJtuzXjHo3MuLxqp8fNo9vzdgfX2SJYqblY0gmbnWRcivV1YIWhkfu-PQ_s1xLkTpcVJ0huYPYHz6KXMoj2HQLeolW-7ZIolKFNoXBQ6f0v5Dd4R4GtagTskG4r3iEAQi4azow',
     false, true),

    -- ------------------------------------------------------------------------
    -- PLACAS MADRE
    -- ------------------------------------------------------------------------
    (9, 'MB-ASUS-B650E-F', 'ASUS ROG Strix B650E-F Gaming WiFi AM5',
     'VRM de 12+2 fases con disipadores masivos, PCIe 5.0 x16 y audio SupremeFX ROG.',
     410000.00, 8, 3, 
     (SELECT id FROM categoria WHERE nombre = 'Placas Madre'), 
     (SELECT id FROM marca WHERE nombre = 'ASUS'),
     '{"socket": "AM5", "chipset": "B650E", "formato": "ATX", "memoria_tipo": "DDR5", "slots_ram": 4}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBkRGhRL2GKFiI-yK5c6SZhfFw8EjJjsBwXLzT3MIN3beGdo41DB1dBJPQeXq0ufvovEZ6ddJx9kAaUgJxEm0bE0fFW-HE4eqKOoTEem-rXbyT7mOyvQ9z4tLfoGHUd5-Sl0AxuNZDLaksXW1g5QKdW7MsD3zFRlpP7nrsdLZFWxfNwfIIKiWGFslzKYeeRPLxDsrePcNIlEeDuqoU_at5OEUi6Wm5parKQeio-W6bYSiGC9oekPWoqCA',
     false, true),

    (10, 'MB-MSI-B650-TOMAHAWK', 'MSI MAG B650 Tomahawk WiFi AM5',
     'Construcción de grado militar, disipación M.2 Shield Frozr y soporte nativo DDR5 a 6600+ MHz.',
     350000.00, 5, 2, 
     (SELECT id FROM categoria WHERE nombre = 'Placas Madre'), 
     (SELECT id FROM marca WHERE nombre = 'MSI'),
     '{"socket": "AM5", "chipset": "B650", "formato": "ATX", "memoria_tipo": "DDR5", "slots_ram": 4}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBkRGhRL2GKFiI-yK5c6SZhfFw8EjJjsBwXLzT3MIN3beGdo41DB1dBJPQeXq0ufvovEZ6ddJx9kAaUgJxEm0bE0fFW-HE4eqKOoTEem-rXbyT7mOyvQ9z4tLfoGHUd5-Sl0AxuNZDLaksXW1g5QKdW7MsD3zFRlpP7nrsdLZFWxfNwfIIKiWGFslzKYeeRPLxDsrePcNIlEeDuqoU_at5OEUi6Wm5parKQeio-W6bYSiGC9oekPWoqCA',
     false, true),

    (11, 'MB-ASUS-Z790-HERO', 'ASUS ROG Maximus Z790 Dark Hero LGA1700',
     'Placa base entusiasta para overclocking extremo de Intel Core 14va gen con 20+1 fases y WiFi 7.',
     890000.00, 2, 2, 
     (SELECT id FROM categoria WHERE nombre = 'Placas Madre'), 
     (SELECT id FROM marca WHERE nombre = 'ASUS'),
     '{"socket": "LGA1700", "chipset": "Z790", "formato": "ATX", "memoria_tipo": "DDR5", "slots_ram": 4}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBkRGhRL2GKFiI-yK5c6SZhfFw8EjJjsBwXLzT3MIN3beGdo41DB1dBJPQeXq0ufvovEZ6ddJx9kAaUgJxEm0bE0fFW-HE4eqKOoTEem-rXbyT7mOyvQ9z4tLfoGHUd5-Sl0AxuNZDLaksXW1g5QKdW7MsD3zFRlpP7nrsdLZFWxfNwfIIKiWGFslzKYeeRPLxDsrePcNIlEeDuqoU_at5OEUi6Wm5parKQeio-W6bYSiGC9oekPWoqCA',
     false, true),

    (12, 'MB-GIG-B760M-DS3H', 'Gigabyte B760M DS3H AX DDR4 LGA1700',
     'Formato Micro-ATX económico y eficiente con soporte para memorias DDR4 y conectividad inalámbrica WiFi 6.',
     210000.00, 14, 3, 
     (SELECT id FROM categoria WHERE nombre = 'Placas Madre'), 
     (SELECT id FROM marca WHERE nombre = 'Gigabyte'),
     '{"socket": "LGA1700", "chipset": "B760", "formato": "Micro-ATX", "memoria_tipo": "DDR4", "slots_ram": 4}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBkRGhRL2GKFiI-yK5c6SZhfFw8EjJjsBwXLzT3MIN3beGdo41DB1dBJPQeXq0ufvovEZ6ddJx9kAaUgJxEm0bE0fFW-HE4eqKOoTEem-rXbyT7mOyvQ9z4tLfoGHUd5-Sl0AxuNZDLaksXW1g5QKdW7MsD3zFRlpP7nrsdLZFWxfNwfIIKiWGFslzKYeeRPLxDsrePcNIlEeDuqoU_at5OEUi6Wm5parKQeio-W6bYSiGC9oekPWoqCA',
     false, true),

    -- ------------------------------------------------------------------------
    -- FUENTES DE PODER (PSU)
    -- ------------------------------------------------------------------------
    (13, 'PSU-SEA-FOCUS-850', 'Seasonic Focus GX-850 ATX 3.0 850W 80+ Gold',
     'Certificación 80 Plus Gold, conector nativo PCIe 5.0 12VHPWR y modo de ventilación híbrido silencioso.',
     265000.00, 11, 4, 
     (SELECT id FROM categoria WHERE nombre = 'Fuentes de Poder'), 
     (SELECT id FROM marca WHERE nombre = 'Seasonic'),
     '{"watts": 850, "certificacion": "80+ Gold", "modular": true, "formato": "ATX", "atx3_compliant": true}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuB71CgfOOXBUhhQ6vyIvKb562cmLK5RRVNYpFcDl1IAJA15tnT-y-4cMdsySH32qhWaRvBQ4H6D-2k3PZY8j6hxLhnX3zVrEqdJVmaewksrwLIPklwf2Ei0GPl26VzHbRzJ-xVyPb1t88yNKgDkBRxr31E3dZ4HGM4fkyfm2IXQR_aVnS0yh2Ocr2ff-SQFE_T4M5HaD-pJAw0yd0TSLuteyeT8ZWbSKlO3YRxTuZdre9GGbn1hVqICxw',
     true, true),

    (14, 'PSU-COR-RM1000X', 'Corsair RM1000x Shift ATX 3.0 1000W 80+ Gold',
     'Innovador sistema de conexión lateral patentado, condensadores japoneses a 105°C y potencia para multi-GPU.',
     340000.00, 6, 2, 
     (SELECT id FROM categoria WHERE nombre = 'Fuentes de Poder'), 
     (SELECT id FROM marca WHERE nombre = 'Corsair'),
     '{"watts": 1000, "certificacion": "80+ Gold", "modular": true, "formato": "ATX", "atx3_compliant": true}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuB71CgfOOXBUhhQ6vyIvKb562cmLK5RRVNYpFcDl1IAJA15tnT-y-4cMdsySH32qhWaRvBQ4H6D-2k3PZY8j6hxLhnX3zVrEqdJVmaewksrwLIPklwf2Ei0GPl26VzHbRzJ-xVyPb1t88yNKgDkBRxr31E3dZ4HGM4fkyfm2IXQR_aVnS0yh2Ocr2ff-SQFE_T4M5HaD-pJAw0yd0TSLuteyeT8ZWbSKlO3YRxTuZdre9GGbn1hVqICxw',
     false, true),

    (15, 'PSU-SEA-FOCUS-650', 'Seasonic Focus GX-650 650W 80+ Gold',
     'Eficiencia legendaria y garantía extendida para equipos de gama media.',
     185000.00, 8, 3, 
     (SELECT id FROM categoria WHERE nombre = 'Fuentes de Poder'), 
     (SELECT id FROM marca WHERE nombre = 'Seasonic'),
     '{"watts": 650, "certificacion": "80+ Gold", "modular": true, "formato": "ATX", "atx3_compliant": false}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuB71CgfOOXBUhhQ6vyIvKb562cmLK5RRVNYpFcDl1IAJA15tnT-y-4cMdsySH32qhWaRvBQ4H6D-2k3PZY8j6hxLhnX3zVrEqdJVmaewksrwLIPklwf2Ei0GPl26VzHbRzJ-xVyPb1t88yNKgDkBRxr31E3dZ4HGM4fkyfm2IXQR_aVnS0yh2Ocr2ff-SQFE_T4M5HaD-pJAw0yd0TSLuteyeT8ZWbSKlO3YRxTuZdre9GGbn1hVqICxw',
     false, true),

    -- ------------------------------------------------------------------------
    -- GABINETES
    -- ------------------------------------------------------------------------
    (16, 'CASE-LIAN-O11D-EVO', 'Lian Li O11 Dynamic EVO Black',
     'Chasis icónico con doble panel de vidrio templado, diseño de doble cámara y máxima versatilidad de refrigeración líquida.',
     295000.00, 9, 3, 
     (SELECT id FROM categoria WHERE nombre = 'Gabinetes'), 
     (SELECT id FROM marca WHERE nombre = 'Lian Li'),
     '{"max_gpu_mm": 426, "max_cooler_mm": 167, "formatos_placa": ["E-ATX", "ATX", "Micro-ATX"], "formato": "Mid-Tower"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuAKGYKX1sIWQX2cRDeU0aWpme61J_DIsCLShEEA2RReyX_Y6RpJhPtrk6ApYBS1YnfbuOaapzHHJj4icbDF_vabf6Z8J56Wvmy6kiRGzDItgWWwBkhNFd5Jcy4yVdevlwHBhsCmz6HEfCVudju4qOjsOrpHb1VpeoP9AatuBA80Oqkb_ybq-2vrNO7Tk6TG3vbdHXaFETpyFDoQJ1l0sn_nH6nf-j-u82BvIvt8lUkJRDnTBps540OynQ',
     true, true),

    (17, 'CASE-COR-4000D', 'Corsair 4000D Airflow Tempered Glass Black',
     'Panel frontal con patrón triangular para flujo de aire canalizado de alto caudal y sistema de cables RapidRoute.',
     185000.00, 7, 2, 
     (SELECT id FROM categoria WHERE nombre = 'Gabinetes'), 
     (SELECT id FROM marca WHERE nombre = 'Corsair'),
     '{"max_gpu_mm": 360, "max_cooler_mm": 170, "formatos_placa": ["ATX", "Micro-ATX", "Mini-ITX"], "formato": "Mid-Tower"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuAKGYKX1sIWQX2cRDeU0aWpme61J_DIsCLShEEA2RReyX_Y6RpJhPtrk6ApYBS1YnfbuOaapzHHJj4icbDF_vabf6Z8J56Wvmy6kiRGzDItgWWwBkhNFd5Jcy4yVdevlwHBhsCmz6HEfCVudju4qOjsOrpHb1VpeoP9AatuBA80Oqkb_ybq-2vrNO7Tk6TG3vbdHXaFETpyFDoQJ1l0sn_nH6nf-j-u82BvIvt8lUkJRDnTBps540OynQ',
     false, true),

    (18, 'CASE-LIAN-A4H2O', 'Lian Li Dan A4-H2O Mini-ITX PCIe 4.0 Black',
     'Chasis ultra compacto SFF de 11 litros en aluminio anodizado para setups minimalistas extremos.',
     245000.00, 3, 2, 
     (SELECT id FROM categoria WHERE nombre = 'Gabinetes'), 
     (SELECT id FROM marca WHERE nombre = 'Lian Li'),
     '{"max_gpu_mm": 322, "max_cooler_mm": 55, "formatos_placa": ["Mini-ITX"], "formato": "Small Form Factor"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuAKGYKX1sIWQX2cRDeU0aWpme61J_DIsCLShEEA2RReyX_Y6RpJhPtrk6ApYBS1YnfbuOaapzHHJj4icbDF_vabf6Z8J56Wvmy6kiRGzDItgWWwBkhNFd5Jcy4yVdevlwHBhsCmz6HEfCVudju4qOjsOrpHb1VpeoP9AatuBA80Oqkb_ybq-2vrNO7Tk6TG3vbdHXaFETpyFDoQJ1l0sn_nH6nf-j-u82BvIvt8lUkJRDnTBps540OynQ',
     false, true),

    -- ------------------------------------------------------------------------
    -- TENGU (RAM)
    -- ------------------------------------------------------------------------
    (19, 'RAM-COR-DDR5-32GB', 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz CL30',
     'Frecuencia veloz con soporte AMD EXPO e Intel XMP 3.0 e iluminación dinámica iCUE de diez zonas.',
     189500.00, 20, 5, 
     (SELECT id FROM categoria WHERE nombre = 'Tengu'), 
     (SELECT id FROM marca WHERE nombre = 'Corsair'),
     '{"tipo": "DDR5", "capacidad_gb": 32, "modulos": 2, "velocidad_mhz": 6000, "latencia_cl": 30}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBTmZ7clAzcydfkz0xXT1Uj84cfcFSoxUI3330MD1xyvx2cLE4yYGsYw56ZiSnPELBTrcMhTj6JTmL19Bt7Khb0yLiFKjSx9wBVB8YXMMAYvDIhxx6bsRHDlonHaXJ-zj4PS_KHEuPKt3LfA-wx4DGndbs7JugglSeQbK8YuSAWoGW7cibWvWH9H-Pbac6ddkoHVG7p707g_Jzqnup-NVtw24g_AGcTjsZOH6XZHa07FnDfENVasSTJww',
     true, true),

    (20, 'RAM-KIN-DDR4-16GB', 'Kingston Fury Beast 16GB (2x8GB) DDR4 3200MHz CL16',
     'Actualización eficiente Plug-and-Play para plataformas DDR4 con disipador de calor de perfil bajo.',
     68000.00, 25, 5, 
     (SELECT id FROM categoria WHERE nombre = 'Tengu'), 
     (SELECT id FROM marca WHERE nombre = 'Kingston'),
     '{"tipo": "DDR4", "capacidad_gb": 16, "modulos": 2, "velocidad_mhz": 3200, "latencia_cl": 16}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuBTmZ7clAzcydfkz0xXT1Uj84cfcFSoxUI3330MD1xyvx2cLE4yYGsYw56ZiSnPELBTrcMhTj6JTmL19Bt7Khb0yLiFKjSx9wBVB8YXMMAYvDIhxx6bsRHDlonHaXJ-zj4PS_KHEuPKt3LfA-wx4DGndbs7JugglSeQbK8YuSAWoGW7cibWvWH9H-Pbac6ddkoHVG7p707g_Jzqnup-NVtw24g_AGcTjsZOH6XZHa07FnDfENVasSTJww',
     false, true),

    -- ------------------------------------------------------------------------
    -- ALMACENAMIENTO (SSDs)
    -- ------------------------------------------------------------------------
    (21, 'SSD-KIN-RENEGADE-2TB', 'Kingston Fury Renegade 2TB M.2 PCIe 4.0 NVMe',
     'Velocidades extremas de hasta 7.300 MB/s de lectura con disipador de grafeno y aluminio de bajo perfil.',
     225000.00, 14, 4, 
     (SELECT id FROM categoria WHERE nombre = 'Almacenamiento'), 
     (SELECT id FROM marca WHERE nombre = 'Kingston'),
     '{"tipo": "NVMe", "capacidad_gb": 2000, "lectura_mb_s": 7300, "escritura_mb_s": 7000, "interfaz": "PCIe 4.0 x4"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuD-8KMrh-Pl5NeuV3wWzAwd6qUl3CuXhb7FNAINJj8b5NU-SedYxO2Uroy2vh1tGinNZR4_JxL_xcM3YOYiIIxS3CwT6Iyqat0Dlb362POpS0Kk6XkNG1oWzLOAmO6WAY1bysT67JNEKEdpFDWAIXIulR7-m45sWY8BvpghdM3XjNvzvW_XUZJVlPR45OeI0kPx9RrtBRslevhHAiuYYCW-52YnNQbIFMuHs5dLnxBW8YEADuok4InFvA',
     true, true),

    (22, 'SSD-WD-SN850X-1TB', 'Western Digital Black SN850X 1TB M.2 PCIe 4.0 NVMe',
     'Unidad para gamers de competición con Game Mode 2.0 y rendimiento sostenido de 7.300 MB/s.',
     145000.00, 8, 3, 
     (SELECT id FROM categoria WHERE nombre = 'Almacenamiento'), 
     (SELECT id FROM marca WHERE nombre = 'Western Digital'),
     '{"tipo": "NVMe", "capacidad_gb": 1000, "lectura_mb_s": 7300, "escritura_mb_s": 6300, "interfaz": "PCIe 4.0 x4"}'::jsonb,
     'https://lh3.googleusercontent.com/aida-public/AB6AXuD-8KMrh-Pl5NeuV3wWzAwd6qUl3CuXhb7FNAINJj8b5NU-SedYxO2Uroy2vh1tGinNZR4_JxL_xcM3YOYiIIxS3CwT6Iyqat0Dlb362POpS0Kk6XkNG1oWzLOAmO6WAY1bysT67JNEKEdpFDWAIXIulR7-m45sWY8BvpghdM3XjNvzvW_XUZJVlPR45OeI0kPx9RrtBRslevhHAiuYYCW-52YnNQbIFMuHs5dLnxBW8YEADuok4InFvA',
     false, true)

ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    nombre = EXCLUDED.nombre,
    precio = EXCLUDED.precio,
    stock = EXCLUDED.stock,
    stock_minimo = EXCLUDED.stock_minimo,
    categoria_id = EXCLUDED.categoria_id,
    marca_id = EXCLUDED.marca_id,
    especificaciones = EXCLUDED.especificaciones,
    imagen_url = EXCLUDED.imagen_url,
    destacado = EXCLUDED.destacado,
    activo = EXCLUDED.activo;

-- Sincronizar secuencia de producto
SELECT setval('producto_id_seq', (SELECT COALESCE(MAX(id), 1) FROM producto));


-- 3. CARRITO PERSISTENTE DE PRUEBA
-- Cliente Abril (id 2) tiene en su carrito 1 RAM y 1 SSD
INSERT INTO carrito_item (id, usuario_id, producto_id, cantidad) VALUES
    (1, 2, 19, 1),
    (2, 2, 21, 1)
ON CONFLICT (usuario_id, producto_id) DO UPDATE SET
    cantidad = EXCLUDED.cantidad;

SELECT setval('carrito_item_id_seq', (SELECT COALESCE(MAX(id), 1) FROM carrito_item));


-- 4. PEDIDOS HISTÓRICOS Y DETALLE CONGELADO
-- Pedido 1001: ENTREGADO (Pagado y despachado con éxito)
INSERT INTO pedido (id_pedido, usuario_id, fecha, estado, total, direccion_envio, metodo_pago) VALUES
    (1001, 2, '2026-10-12 15:30:00', 'ENTREGADO', 889499.00, 'Av. San Martín 850, San Rafael, Mendoza (CP 5600)', 'Transferencia Bancaria')
ON CONFLICT (id_pedido) DO UPDATE SET
    estado = EXCLUDED.estado,
    total = EXCLUDED.total;

INSERT INTO detalle_pedido (id_detalle, pedido_id, producto_id, cantidad, precio_unit) VALUES
    (1, 1001, 5, 1, 699999.00), -- CPU Ryzen 7800X3D (precio congelado)
    (2, 1001, 19, 1, 189500.00) -- RAM Corsair DDR5 32GB (precio congelado)
ON CONFLICT (id_detalle) DO UPDATE SET
    precio_unit = EXCLUDED.precio_unit,
    cantidad = EXCLUDED.cantidad;

-- Pedido 1002: PENDIENTE_PAGO (Recién iniciado en checkout)
INSERT INTO pedido (id_pedido, usuario_id, fecha, estado, total, direccion_envio, metodo_pago) VALUES
    (1002, 3, '2026-10-20 18:00:00', 'PENDIENTE_PAGO', 1420000.00, 'Hipólito Yrigoyen 1420, San Rafael, Mendoza', 'Mercado Pago')
ON CONFLICT (id_pedido) DO UPDATE SET
    estado = EXCLUDED.estado,
    total = EXCLUDED.total;

INSERT INTO detalle_pedido (id_detalle, pedido_id, producto_id, cantidad, precio_unit) VALUES
    (3, 1002, 1, 1, 1420000.00) -- GPU RTX 4070 Ti SUPER
ON CONFLICT (id_detalle) DO UPDATE SET
    precio_unit = EXCLUDED.precio_unit,
    cantidad = EXCLUDED.cantidad;

-- Sincronizar secuencias de pedidos
SELECT setval('pedido_id_pedido_seq', (SELECT COALESCE(MAX(id_pedido), 1) FROM pedido));
SELECT setval('detalle_pedido_id_detalle_seq', (SELECT COALESCE(MAX(id_detalle), 1) FROM detalle_pedido));
