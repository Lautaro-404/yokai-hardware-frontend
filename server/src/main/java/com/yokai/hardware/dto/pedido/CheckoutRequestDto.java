package com.yokai.hardware.dto.pedido;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequestDto(
    @NotBlank(message = "La dirección de envío es requerida")
    String direccionEnvio,

    String metodoPago
) {}
