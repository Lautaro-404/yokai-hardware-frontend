package com.yokai.hardware.entity;

public enum EstadoPedido {
    PENDIENTE_PAGO,
    PAGADO,
    EN_PREPARACION,
    ENVIADO,
    ENTREGADO,
    CANCELADO;

    /**
     * Valida si la transición hacia un nuevo estado es legal según la máquina de estados aprobada.
     */
    public boolean puedeTransicionarA(EstadoPedido nuevoEstado) {
        if (this == nuevoEstado) return true;
        return switch (this) {
            case PENDIENTE_PAGO -> nuevoEstado == PAGADO || nuevoEstado == CANCELADO;
            case PAGADO -> nuevoEstado == EN_PREPARACION || nuevoEstado == CANCELADO;
            case EN_PREPARACION -> nuevoEstado == ENVIADO || nuevoEstado == CANCELADO;
            case ENVIADO -> nuevoEstado == ENTREGADO;
            case ENTREGADO, CANCELADO -> false; // Estados finales terminales
        };
    }
}
