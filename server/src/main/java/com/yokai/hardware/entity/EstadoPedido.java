package com.yokai.hardware.entity;

import java.util.List;

public enum EstadoPedido {
    PENDIENTE_PAGO,
    PAGADO,
    EN_PREPARACION,
    ENVIADO,
    ENTREGADO,
    CANCELADO;

    /**
     * Lista de estados a los que puede transicionar válidamente el estado actual.
     */
    public List<EstadoPedido> transicionesPermitidas() {
        return switch (this) {
            case PENDIENTE_PAGO -> List.of(PAGADO, CANCELADO);
            case PAGADO -> List.of(EN_PREPARACION, CANCELADO);
            case EN_PREPARACION -> List.of(ENVIADO, CANCELADO);
            case ENVIADO -> List.of(ENTREGADO);
            case ENTREGADO, CANCELADO -> List.of();
        };
    }

    /**
     * Valida si la transición hacia un nuevo estado es legal según la máquina de estados aprobada.
     */
    public boolean puedeTransicionarA(EstadoPedido nuevoEstado) {
        if (nuevoEstado == null) {
            return false;
        }
        return transicionesPermitidas().contains(nuevoEstado);
    }
}
