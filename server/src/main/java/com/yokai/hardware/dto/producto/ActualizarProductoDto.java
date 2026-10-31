package com.yokai.hardware.dto.producto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record ActualizarProductoDto(
    String sku,

    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    String nombre,

    String descripcion,

    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    BigDecimal precio,

    @Min(value = 0, message = "El stock no puede ser negativo")
    Integer stock,

    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    Integer stockMinimo,

    String categoria,
    String marca,
    String imagen,
    String subtituloCorto,
    Boolean destacado,
    Map<String, Object> especificaciones
) {}
