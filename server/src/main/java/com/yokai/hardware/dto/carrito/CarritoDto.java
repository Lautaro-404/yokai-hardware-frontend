package com.yokai.hardware.dto.carrito;

import java.math.BigDecimal;
import java.util.List;

public record CarritoDto(
    List<CarritoItemDto> items,
    Integer cantidadTotal,
    BigDecimal total
) {}
