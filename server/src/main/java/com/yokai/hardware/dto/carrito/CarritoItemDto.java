package com.yokai.hardware.dto.carrito;

import com.yokai.hardware.dto.producto.ProductoCardDto;

import java.math.BigDecimal;

public record CarritoItemDto(
    Long id,
    ProductoCardDto producto,
    Integer cantidad,
    BigDecimal subtotal
) {}
