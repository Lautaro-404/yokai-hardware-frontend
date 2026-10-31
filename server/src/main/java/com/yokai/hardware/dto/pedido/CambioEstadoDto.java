package com.yokai.hardware.dto.pedido;

import jakarta.validation.constraints.NotBlank;

public record CambioEstadoDto(
    @NotBlank(message = "El nuevo estado es requerido")
    String estado
) {}
