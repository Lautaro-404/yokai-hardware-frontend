package com.yokai.hardware.dto.producto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record CrearProductoDto(
    String sku,

    @NotBlank(message = "El nombre del producto es requerido")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    String nombre,

    String descripcion,

    @NotNull(message = "El precio es requerido")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    BigDecimal precio,

    @NotNull(message = "El stock es requerido")
    @Min(value = 0, message = "El stock no puede ser negativo")
    Integer stock,

    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    Integer stockMinimo,

    @NotBlank(message = "La categoría es requerida")
    String categoria,

    @NotBlank(message = "La marca es requerida")
    String marca,

    String imagen,
    String subtituloCorto,
    Boolean destacado,
    Map<String, Object> especificaciones
) {}
