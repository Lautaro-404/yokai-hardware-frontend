package com.yokai.hardware.entity;

/**
 * Estado de stock visible. Se calcula a partir de stock y stockMinimo; nunca se persiste.
 */
public enum EstadoStock {
    EN_STOCK("En stock"),
    ULTIMAS_UNIDADES("Últimas unidades"),
    SIN_STOCK("Sin stock");

    private final String etiqueta;

    EstadoStock(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public static EstadoStock calcular(Integer stock, Integer stockMinimo) {
        int existencias = stock != null ? stock : 0;
        int minimo = stockMinimo != null ? stockMinimo : 0;
        if (existencias <= 0) {
            return SIN_STOCK;
        }
        return existencias <= minimo ? ULTIMAS_UNIDADES : EN_STOCK;
    }
}
