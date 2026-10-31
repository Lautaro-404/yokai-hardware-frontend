package com.yokai.hardware.dto.producto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductoDetalleDto(
    Long id,
    String sku,
    String nombre,
    String descripcion,
    BigDecimal precio,
    Integer stock,
    Integer stockMinimo,
    String estadoStock,
    String imagen,
    List<String> imagenes,
    String categoria,
    String marca,
    String etiquetaYokai,
    String subtituloCorto,
    Boolean destacado,
    Map<String, Object> especificaciones
) {
    public static ProductoDetalleDto desde(ProductoCardDto c) {
        List<String> imagenes = c.imagen() != null && !c.imagen().isBlank() ? List.of(c.imagen()) : List.of();
        return new ProductoDetalleDto(
            c.id(), c.sku(), c.nombre(), c.descripcion(), c.precio(), c.stock(), c.stockMinimo(),
            c.estadoStock(), c.imagen(), imagenes, c.categoria(), c.marca(), c.etiquetaYokai(),
            c.subtituloCorto(), c.destacado(), c.especificaciones()
        );
    }
}
