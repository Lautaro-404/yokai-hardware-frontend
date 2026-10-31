package com.yokai.hardware.dto.carrito;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CarritoItemRequestDto(
    @NotNull(message = "El ID del producto es requerido")
    Long productoId,

    @NotNull(message = "La cantidad es requerida")
    @Min(value = 1, message = "La cantidad debe ser de al menos 1 unidad")
    Integer cantidad
) {}
