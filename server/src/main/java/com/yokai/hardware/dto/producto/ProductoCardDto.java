package com.yokai.hardware.dto.producto;

import java.math.BigDecimal;
import java.util.Map;

public record ProductoCardDto(
    Long id,
    String sku,
    String nombre,
    String descripcion,
    BigDecimal precio,
    Integer stock,
    Integer stockMinimo,
    String estadoStock,
    String imagen,
    String categoria,
    String marca,
    String etiquetaYokai,
    String subtituloCorto,
    Boolean destacado,
    Map<String, Object> especificaciones
) {}
