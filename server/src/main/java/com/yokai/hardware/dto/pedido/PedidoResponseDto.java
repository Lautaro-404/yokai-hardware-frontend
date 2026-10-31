package com.yokai.hardware.dto.pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponseDto(
    Long id,
    LocalDateTime fecha,
    String estado,
    BigDecimal total,
    String direccionEnvio,
    String metodoPago,
    List<DetallePedidoResponseDto> detalles
) {}
