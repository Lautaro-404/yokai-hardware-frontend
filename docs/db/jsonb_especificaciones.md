# Contrato de Especificaciones Técnicas JSONB y Motor de Compatibilidad

## 1. Reglas Generales de Formato
- **Convención de nomenclatura**: Claves exclusivamente en `snake_case`.
- **Valores numéricos**: Deben persistirse como números nativos (`120`), **nunca** como cadenas de texto con sufijos (`"120W"`). La unidad de medida forma parte del nombre de la clave (`_w`, `_mm`, `_gb`, `_mhz`).
- **Valores booleanos**: `true` o `false` nativos.
- **Validación a nivel de Base de Datos**: Respaldada por el trigger `trg_validar_especificaciones_producto` (definido en `V6__validacion_especificaciones.sql`).

---

## 2. Esquemas por Categoría

### 2.1 Oni (Tarjetas Gráficas / GPUs)
Atributos críticos requeridos por el motor de compatibilidad:
- `tdp_w` (`number`, obligatorio): Consumo térmico de diseño en vatios.
- `length_mm` (`number`, obligatorio): Longitud física de la placa en milímetros.
- `vram_gb` (`number`): Memoria de video en gigabytes.
- `memoria_tipo` (`string`): Tipo de memoria (ej. `'GDDR6X'`).
- `power_connector` (`string`): Conector de alimentación (ej. `'16-pin 12VHPWR'`).
- `slots` (`number`): Grosor en ranuras PCIe (ej. `3.15`).

```json
{
  "tdp_w": 285,
  "length_mm": 336,
  "vram_gb": 16,
  "memoria_tipo": "GDDR6X",
  "power_connector": "16-pin 12VHPWR",
  "slots": 3.15
}
```

### 2.2 Kitsune (Procesadores / CPUs)
Atributos críticos requeridos por el motor de compatibilidad:
- `socket` (`string`, obligatorio): Zócalo de montaje (ej. `'AM5'`, `'LGA1700'`).
- `tdp_w` (`number`, obligatorio): Consumo térmico de diseño en vatios.
- `nucleos` (`number`): Cantidad de núcleos físicos.
- `hilos` (`number`): Cantidad de hilos de procesamiento.
- `base_ghz` (`number`): Frecuencia base en GHz.
- `boost_ghz` (`number`): Frecuencia turbo máxima en GHz.
- `memoria_soportada` (`string`): Tipos de memoria compatibles (ej. `'DDR5'`).

```json
{
  "socket": "AM5",
  "tdp_w": 120,
  "nucleos": 8,
  "hilos": 16,
  "base_ghz": 4.2,
  "boost_ghz": 5.0,
  "memoria_soportada": "DDR5"
}
```

### 2.3 Placas Madre (Motherboards)
Atributos críticos requeridos por el motor de compatibilidad:
- `socket` (`string`, obligatorio): Zócalo del procesador (ej. `'AM5'`, `'LGA1700'`).
- `chipset` (`string`): Chipset del puente sur (ej. `'B650'`, `'Z790'`).
- `formato` (`string`): Factor de forma (ej. `'ATX'`, `'Micro-ATX'`, `'Mini-ITX'`).
- `memoria_tipo` (`string`): Estándar de RAM soportado (`'DDR5'` o `'DDR4'`).
- `slots_ram` (`number`): Cantidad de ranuras DIMM.

```json
{
  "socket": "AM5",
  "chipset": "B650E",
  "formato": "ATX",
  "memoria_tipo": "DDR5",
  "slots_ram": 4
}
```

### 2.4 Fuentes de Poder (PSU)
Atributos críticos requeridos por el motor de compatibilidad:
- `watts` (`number`, obligatorio): Potencia nominal continua de salida en vatios.
- `certificacion` (`string`): Nivel 80 Plus (ej. `'80+ Gold'`).
- `modular` (`boolean`): Si el cableado es modular o fijo.
- `formato` (`string`): Factor de forma (ej. `'ATX'`, `'SFX'`).
- `atx3_compliant` (`boolean`): Compatibilidad nativa con ATX 3.0 / PCIe 5.0.

```json
{
  "watts": 850,
  "certificacion": "80+ Gold",
  "modular": true,
  "formato": "ATX",
  "atx3_compliant": true
}
```

### 2.5 Gabinetes (Cases)
Atributos críticos requeridos por el motor de compatibilidad:
- `max_gpu_mm` (`number`, obligatorio): Espacio libre máximo para tarjeta gráfica en milímetros.
- `max_cooler_mm` (`number`): Altura máxima permitida para disipadores de CPU.
- `formatos_placa` (`array of strings`): Placas soportadas (ej. `["ATX", "Micro-ATX"]`).
- `formato` (`string`): Tamaño comercial (ej. `'Mid-Tower'`).

```json
{
  "max_gpu_mm": 426,
  "max_cooler_mm": 167,
  "formatos_placa": ["ATX", "Micro-ATX"],
  "formato": "Mid-Tower"
}
```

### 2.6 Tengu (Memoria RAM)
- `tipo` (`string`): `'DDR5'` o `'DDR4'`.
- `capacidad_gb` (`number`): Total del kit en GB.
- `modulos` (`number`): Cantidad de sticks (ej. `2`).
- `velocidad_mhz` (`number`): Frecuencia efectiva (ej. `6000`).
- `latencia_cl` (`number`): Latencia CAS (ej. `30`).

---

## 3. Reglas Aritméticas del CompatibilidadEngine

1. **CPU y Placa Madre:**
   `cpu.especificaciones->>'socket' == motherboard.especificaciones->>'socket'`
2. **Fuente de Poder y Consumo Total:**
   `psu.especificaciones->>'watts' >= (cpu.especificaciones->>'tdp_w' + gpu.especificaciones->>'tdp_w') * 1.25`
3. **Tarjeta Gráfica y Gabinete:**
   `gpu.especificaciones->>'length_mm' <= case.especificaciones->>'max_gpu_mm'`
