package com.yokai.hardware.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EstadoStockTest {

    @ParameterizedTest(name = "stock={0}, stockMinimo={1} -> {2}")
    @DisplayName("calcular clasifica segun stock y stockMinimo")
    @CsvSource({
            "10, 3, EN_STOCK",
            "4, 3, EN_STOCK",
            "3, 3, ULTIMAS_UNIDADES",
            "1, 3, ULTIMAS_UNIDADES",
            "1, 0, EN_STOCK",
            "0, 3, SIN_STOCK",
            "0, 0, SIN_STOCK"
    })
    void calcularSegunUmbrales(int stock, int stockMinimo, EstadoStock esperado) {
        assertEquals(esperado, EstadoStock.calcular(stock, stockMinimo));
    }

    @Test
    @DisplayName("calcular trata valores nulos como cero")
    void calcularConNulos() {
        assertEquals(EstadoStock.SIN_STOCK, EstadoStock.calcular(null, null));
        assertEquals(EstadoStock.EN_STOCK, EstadoStock.calcular(5, null));
    }

    @Test
    @DisplayName("las etiquetas visibles coinciden con las del negocio")
    void etiquetas() {
        assertEquals("En stock", EstadoStock.EN_STOCK.getEtiqueta());
        assertEquals("Últimas unidades", EstadoStock.ULTIMAS_UNIDADES.getEtiqueta());
        assertEquals("Sin stock", EstadoStock.SIN_STOCK.getEtiqueta());
    }
}
