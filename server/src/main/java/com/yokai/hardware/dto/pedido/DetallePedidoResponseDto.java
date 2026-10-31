package com.yokai.hardware.dto.pedido;

import java.math.BigDecimal;

public record DetallePedidoResponseDto(
    Long productoId,
    String nombre,
    String imagen,
    Integer cantidad,
    BigDecimal precioUnitario
) {}
