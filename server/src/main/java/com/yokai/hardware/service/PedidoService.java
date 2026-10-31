package com.yokai.hardware.service;

import com.yokai.hardware.dto.pedido.*;
import com.yokai.hardware.entity.CarritoItem;
import com.yokai.hardware.entity.DetallePedido;
import com.yokai.hardware.entity.EstadoPedido;
import com.yokai.hardware.entity.Pedido;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.exception.StockConflictException;
import com.yokai.hardware.repository.CarritoItemRepository;
import com.yokai.hardware.repository.PedidoRepository;
import com.yokai.hardware.repository.ProductoRepository;
import com.yokai.hardware.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CarritoItemRepository carritoItemRepository;

    public PedidoService(
            PedidoRepository pedidoRepository,
            ProductoRepository productoRepository,
            UsuarioRepository usuarioRepository,
            CarritoItemRepository carritoItemRepository
    ) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.carritoItemRepository = carritoItemRepository;
    }

    /**
     * Checkout Transaccional Atómico:
     * 1. Toma los ítems del carrito persistido del usuario.
     * 2. Ordena ítems por ID de producto para prevenir deadlocks.
     * 3. Valida y descuenta el stock atómicamente (si alguno no alcanza, revierte todo y lanza 409).
     * 4. Crea el Pedido y los DetallePedido guardando el precio unitario del momento.
     * 5. Vacía el carrito del usuario.
     */
    @Transactional
    public PedidoResponseDto crearPedido(Long usuarioId, CheckoutRequestDto dto) {
        if (dto == null || dto.direccionEnvio() == null || dto.direccionEnvio().isBlank()) {
            throw new BusinessValidationException("La dirección de envío es requerida.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

        List<CarritoItem> itemsCarrito = carritoItemRepository.findByUsuarioIdWithProducto(usuarioId);
        if (itemsCarrito == null || itemsCarrito.isEmpty()) {
            throw new BusinessValidationException("El carrito está vacío. Agregá productos antes de confirmar el pedido.");
        }

        // Ordenamiento por productoId para evitar deadlocks de concurrencia
        List<CarritoItem> itemsOrdenados = itemsCarrito.stream()
                .sorted(Comparator.comparing(item -> item.getProducto().getId()))
                .toList();

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setDireccionEnvio(dto.direccionEnvio().trim());
        pedido.setMetodoPago(dto.metodoPago() != null && !dto.metodoPago().isBlank()
                ? dto.metodoPago().trim()
                : "Transferencia Bancaria");
        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);

        BigDecimal total = BigDecimal.ZERO;

        for (CarritoItem item : itemsOrdenados) {
            Producto producto = item.getProducto();
            int cantidad = item.getCantidad() != null ? item.getCantidad() : 0;
            if (cantidad <= 0) {
                throw new BusinessValidationException("La cantidad del producto \"" + producto.getNombre() + "\" debe ser mayor a 0.");
            }

            int disponible = producto.getStock() != null ? producto.getStock() : 0;

            // Descuento atómico anti-overselling (garantiza que el stock nunca quede negativo)
            int filasModificadas = productoRepository.descontarStock(producto.getId(), cantidad);
            if (filasModificadas == 0) {
                throw new StockConflictException("Stock insuficiente para el producto \"" + producto.getNombre() +
                        "\". Solicitado: " + cantidad + ", disponible: " + disponible);
            }

            // Congelación del precio unitario del momento de la compra
            BigDecimal precioCongelado = producto.getPrecio();
            DetallePedido detalle = new DetallePedido(producto, cantidad, precioCongelado);
            pedido.agregarDetalle(detalle);

            BigDecimal subtotalLinea = precioCongelado.multiply(BigDecimal.valueOf(cantidad));
            total = total.add(subtotalLinea);
        }

        pedido.setTotal(total);

        Pedido guardado = pedidoRepository.save(pedido);

        // Vaciar carrito persistente tras la confirmación exitosa
        carritoItemRepository.deleteAllByUsuarioId(usuarioId);

        return mapToResponseDto(guardado);
    }

    @Transactional(readOnly = true)
    public List<PedidoResponseDto> obtenerMisPedidos(Long usuarioId) {
        return pedidoRepository.findHistorialCompletoByUsuarioId(usuarioId)
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PedidoAdminResponseDto> obtenerTodosPedidosAdmin() {
        return pedidoRepository.findAllWithDetallesAndUsuario()
                .stream()
                .map(p -> new PedidoAdminResponseDto(
                        p.getIdPedido(),
                        p.getUsuario() != null ? p.getUsuario().getId() : null,
                        p.getUsuario() != null ? p.getUsuario().getNombre() : "Usuario Anónimo",
                        p.getUsuario() != null ? p.getUsuario().getEmail() : "",
                        p.getFecha(),
                        p.getEstado().name(),
                        p.getTotal(),
                        p.getDireccionEnvio(),
                        p.getMetodoPago(),
                        p.getDetalles().stream().map(d -> new DetallePedidoResponseDto(
                                d.getProducto().getId(),
                                d.getProducto().getNombre(),
                                d.getProducto().getImagenUrl(),
                                d.getCantidad(),
                                d.getPrecioUnit()
                        )).toList()
                ))
                .toList();
    }

    @Transactional
    public PedidoResponseDto actualizarEstadoPedido(Long pedidoId, String nuevoEstadoStr) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + pedidoId));

        if (nuevoEstadoStr == null || nuevoEstadoStr.isBlank()) {
            throw new BusinessValidationException("El nuevo estado es requerido. Estados válidos: "
                    + Arrays.toString(EstadoPedido.values()));
        }

        EstadoPedido nuevoEstado;
        try {
            nuevoEstado = EstadoPedido.valueOf(nuevoEstadoStr.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessValidationException("Estado de pedido inválido: \"" + nuevoEstadoStr
                    + "\". Estados válidos: " + Arrays.toString(EstadoPedido.values()));
        }

        EstadoPedido estadoActual = pedido.getEstado();
        if (!estadoActual.puedeTransicionarA(nuevoEstado)) {
            throw new BusinessValidationException("Transición inválida de " + estadoActual + " a " + nuevoEstado
                    + ". Transiciones permitidas: " + estadoActual.transicionesPermitidas());
        }

        // Si se cancela una orden que ya había descontado inventario, se restituye el stock
        if (nuevoEstado == EstadoPedido.CANCELADO &&
                (estadoActual == EstadoPedido.PAGADO || estadoActual == EstadoPedido.EN_PREPARACION || estadoActual == EstadoPedido.PENDIENTE_PAGO)) {
            for (DetallePedido detalle : pedido.getDetalles()) {
                productoRepository.restituirStock(detalle.getProducto().getId(), detalle.getCantidad());
            }
        }

        pedido.setEstado(nuevoEstado);
        Pedido actualizado = pedidoRepository.save(pedido);
        return mapToResponseDto(actualizado);
    }

    private PedidoResponseDto mapToResponseDto(Pedido p) {
        List<DetallePedidoResponseDto> detallesDto = p.getDetalles().stream()
                .map(d -> new DetallePedidoResponseDto(
                        d.getProducto().getId(),
                        d.getProducto().getNombre(),
                        d.getProducto().getImagenUrl(),
                        d.getCantidad(),
                        d.getPrecioUnit()
                ))
                .toList();

        return new PedidoResponseDto(
                p.getIdPedido(),
                p.getFecha(),
                p.getEstado().name(),
                p.getTotal(),
                p.getDireccionEnvio(),
                p.getMetodoPago(),
                detallesDto
        );
    }
}
