package com.yokai.hardware.service;

import com.yokai.hardware.dto.pedido.CheckoutRequestDto;
import com.yokai.hardware.dto.pedido.PedidoResponseDto;
import com.yokai.hardware.entity.*;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.exception.StockConflictException;
import com.yokai.hardware.repository.CarritoItemRepository;
import com.yokai.hardware.repository.PedidoRepository;
import com.yokai.hardware.repository.ProductoRepository;
import com.yokai.hardware.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CarritoItemRepository carritoItemRepository;

    @InjectMocks
    private PedidoService pedidoService;

    private Usuario cliente;
    private Producto gpu;
    private Producto ram;

    @BeforeEach
    void setUp() {
        cliente = new Usuario("Abril Cliente", "cliente@yokai.com", "pass123", "CLIENTE");
        cliente.setId(10L);

        Categoria catOni = new Categoria("Oni", "GPUs");
        Categoria catTengu = new Categoria("Tengu", "RAM");
        Marca asus = new Marca("ASUS");
        Marca corsair = new Marca("Corsair");

        gpu = new Producto();
        gpu.setId(1L);
        gpu.setNombre("GeForce RTX 4070 Ti");
        gpu.setSku("GPU-RTX-4070TI");
        gpu.setPrecio(new BigDecimal("1420000.00"));
        gpu.setStock(5);
        gpu.setStockMinimo(2);
        gpu.setCategoria(catOni);
        gpu.setMarca(asus);

        ram = new Producto();
        ram.setId(2L);
        ram.setNombre("Corsair Vengeance 32GB DDR5");
        ram.setSku("RAM-COR-DDR5-32");
        ram.setPrecio(new BigDecimal("189500.00"));
        ram.setStock(2);
        ram.setStockMinimo(1);
        ram.setCategoria(catTengu);
        ram.setMarca(corsair);
    }

    @Test
    @DisplayName("Compra exitosa: toma el carrito del usuario, descuenta stock, congela precio unitario y vacía el carrito")
    void debeCrearPedidoExitosamenteDesdeCarrito() {
        CarritoItem itemGpu = new CarritoItem(cliente, gpu, 1);
        CarritoItem itemRam = new CarritoItem(cliente, ram, 2);

        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(10L)).thenReturn(List.of(itemRam, itemGpu));
        when(productoRepository.descontarStock(1L, 1)).thenReturn(1);
        when(productoRepository.descontarStock(2L, 2)).thenReturn(1);
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocation -> {
            Pedido p = invocation.getArgument(0);
            p.setIdPedido(1001L);
            return p;
        });

        CheckoutRequestDto dto = new CheckoutRequestDto(
                "Av. San Martín 850, San Rafael",
                "Transferencia Bancaria"
        );

        PedidoResponseDto resultado = pedidoService.crearPedido(10L, dto);

        assertNotNull(resultado);
        assertEquals(1001L, resultado.id());
        assertEquals("PENDIENTE_PAGO", resultado.estado());
        // Total = 1 * 1.420.000 + 2 * 189.500 = 1.799.000,00
        assertEquals(new BigDecimal("1799000.00"), resultado.total());
        assertEquals(2, resultado.detalles().size());
        assertEquals(new BigDecimal("1420000.00"), resultado.detalles().get(0).precioUnitario());
        assertEquals(new BigDecimal("189500.00"), resultado.detalles().get(1).precioUnitario());

        ArgumentCaptor<Pedido> pedidoCaptor = ArgumentCaptor.forClass(Pedido.class);
        verify(pedidoRepository, times(1)).save(pedidoCaptor.capture());
        assertEquals(2, pedidoCaptor.getValue().getDetalles().size());

        verify(productoRepository, times(1)).descontarStock(1L, 1);
        verify(productoRepository, times(1)).descontarStock(2L, 2);
        verify(carritoItemRepository, times(1)).deleteAllByUsuarioId(10L);
    }

    @Test
    @DisplayName("Stock insuficiente: falla con 409 (StockConflictException) indicando qué producto no alcanza, sin guardar pedido ni vaciar carrito")
    void debeFallarPorFaltaDeStockIndicandoProducto() {
        CarritoItem itemGpu = new CarritoItem(cliente, gpu, 1);
        CarritoItem itemRamSinStock = new CarritoItem(cliente, ram, 5); // stock disponible = 2

        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(10L)).thenReturn(List.of(itemGpu, itemRamSinStock));
        when(productoRepository.descontarStock(1L, 1)).thenReturn(1);
        when(productoRepository.descontarStock(2L, 5)).thenReturn(0); // segundo producto no alcanza

        CheckoutRequestDto dto = new CheckoutRequestDto("Av. San Martín 850", "Transferencia");

        StockConflictException ex = assertThrows(
                StockConflictException.class,
                () -> pedidoService.crearPedido(10L, dto)
        );

        assertTrue(ex.getMessage().contains("Corsair Vengeance 32GB DDR5"),
                "El mensaje 409 debe indicar qué producto no tiene stock suficiente");
        assertTrue(gpu.getStock() >= 0 && ram.getStock() >= 0, "El stock nunca puede quedar negativo");
        assertEquals(2, ram.getStock(), "El stock del producto no debe quedar negativo");

        verify(pedidoRepository, never()).save(any());
        verify(carritoItemRepository, never()).deleteAllByUsuarioId(any());
    }

    @Test
    @DisplayName("Carrito vacío: debe rechazar con BusinessValidationException")
    void debeRechazarPedidoConCarritoVacio() {
        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(10L)).thenReturn(List.of());

        CheckoutRequestDto dto = new CheckoutRequestDto("Av. San Martín 850", "Transferencia");

        assertThrows(BusinessValidationException.class, () -> pedidoService.crearPedido(10L, dto));
        verify(pedidoRepository, never()).save(any());
        verify(productoRepository, never()).descontarStock(any(), any());
    }

    @Test
    @DisplayName("Stock justo: comprar exactamente el stock disponible es válido")
    void debeAceptarCompraConStockJusto() {
        CarritoItem itemRam = new CarritoItem(cliente, ram, 2); // stock disponible = 2

        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(10L)).thenReturn(List.of(itemRam));
        when(productoRepository.descontarStock(2L, 2)).thenReturn(1);
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(i -> i.getArgument(0));

        PedidoResponseDto resultado = pedidoService.crearPedido(10L, new CheckoutRequestDto("Av. San Martín 850", null));

        assertEquals(new BigDecimal("379000.00"), resultado.total());
        verify(productoRepository).descontarStock(2L, 2);
        verify(carritoItemRepository).deleteAllByUsuarioId(10L);
    }

    @Test
    @DisplayName("Stock insuficiente en el primer ítem: corta de inmediato sin guardar ni vaciar el carrito")
    void debeCortarAlPrimerItemSinStock() {
        CarritoItem itemGpu = new CarritoItem(cliente, gpu, 6); // stock disponible = 5
        CarritoItem itemRam = new CarritoItem(cliente, ram, 1);

        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(10L)).thenReturn(List.of(itemGpu, itemRam));
        when(productoRepository.descontarStock(1L, 6)).thenReturn(0);

        StockConflictException ex = assertThrows(StockConflictException.class,
                () -> pedidoService.crearPedido(10L, new CheckoutRequestDto("Av. San Martín 850", "Transferencia")));

        assertTrue(ex.getMessage().contains("GeForce RTX 4070 Ti"));
        verify(productoRepository, never()).descontarStock(eq(2L), any());
        verify(pedidoRepository, never()).save(any());
        verify(carritoItemRepository, never()).deleteAllByUsuarioId(any());
    }

    @Test
    @DisplayName("Cantidad cero (o negativa) en un ítem: rechaza sin tocar el stock")
    void debeRechazarItemConCantidadCero() {
        CarritoItem itemCero = new CarritoItem(cliente, gpu, 0);
        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(10L)).thenReturn(List.of(itemCero));

        assertThrows(BusinessValidationException.class,
                () -> pedidoService.crearPedido(10L, new CheckoutRequestDto("Av. San Martín 850", "Transferencia")));

        itemCero.setCantidad(-1);
        assertThrows(BusinessValidationException.class,
                () -> pedidoService.crearPedido(10L, new CheckoutRequestDto("Av. San Martín 850", "Transferencia")));

        verify(productoRepository, never()).descontarStock(any(), any());
        verify(pedidoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Dirección de envío vacía, nula o DTO nulo: rechaza antes de consultar nada")
    void debeRechazarDireccionInvalida() {
        assertThrows(BusinessValidationException.class, () -> pedidoService.crearPedido(10L, null));
        assertThrows(BusinessValidationException.class,
                () -> pedidoService.crearPedido(10L, new CheckoutRequestDto("   ", "Transferencia")));
        assertThrows(BusinessValidationException.class,
                () -> pedidoService.crearPedido(10L, new CheckoutRequestDto(null, "Transferencia")));
        verifyNoInteractions(usuarioRepository, carritoItemRepository, productoRepository, pedidoRepository);
    }

    @Test
    @DisplayName("Usuario inexistente: lanza ResourceNotFoundException")
    void debeRechazarUsuarioInexistente() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> pedidoService.crearPedido(99L, new CheckoutRequestDto("Av. San Martín 850", "Transferencia")));
        verifyNoInteractions(carritoItemRepository, productoRepository, pedidoRepository);
    }

    @Test
    @DisplayName("Checkout usa solo el carrito del usuario autenticado y congela el método de pago por defecto")
    void debeUsarSoloCarritoPropio() {
        CarritoItem itemGpu = new CarritoItem(cliente, gpu, 1);
        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(cliente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(10L)).thenReturn(List.of(itemGpu));
        when(productoRepository.descontarStock(1L, 1)).thenReturn(1);
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(i -> i.getArgument(0));

        PedidoResponseDto resultado = pedidoService.crearPedido(10L, new CheckoutRequestDto(" Calle 1 ", " "));

        assertEquals("Transferencia Bancaria", resultado.metodoPago());
        assertEquals("Calle 1", resultado.direccionEnvio());
        verify(carritoItemRepository).findByUsuarioIdWithProducto(10L);
        verify(carritoItemRepository).deleteAllByUsuarioId(10L);
        verify(carritoItemRepository, never()).deleteAllByUsuarioId(eq(11L));
    }

    @Test
    @DisplayName("El historial se consulta únicamente con el id del usuario pedido (no expone pedidos ajenos)")
    void historialSoloDelUsuario() {
        Pedido propio = new Pedido();
        propio.setIdPedido(700L);
        propio.setUsuario(cliente);
        propio.setEstado(EstadoPedido.PENDIENTE_PAGO);
        propio.setTotal(new BigDecimal("100.00"));
        propio.agregarDetalle(new DetallePedido(gpu, 1, gpu.getPrecio()));

        when(pedidoRepository.findHistorialCompletoByUsuarioId(10L)).thenReturn(List.of(propio));
        when(pedidoRepository.findHistorialCompletoByUsuarioId(11L)).thenReturn(List.of());

        List<PedidoResponseDto> mios = pedidoService.obtenerMisPedidos(10L);
        List<PedidoResponseDto> ajenos = pedidoService.obtenerMisPedidos(11L);

        assertEquals(1, mios.size());
        assertEquals(700L, mios.get(0).id());
        assertTrue(ajenos.isEmpty());
        verify(pedidoRepository, never()).findAllWithDetallesAndUsuario();
    }

    @Test
    @DisplayName("Cambiar el estado de un pedido inexistente lanza ResourceNotFoundException")
    void estadoDePedidoInexistente() {
        when(pedidoRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> pedidoService.actualizarEstadoPedido(404L, "PAGADO"));
        verify(pedidoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Estado nulo o vacío se rechaza sin modificar el pedido")
    void estadoVacio() {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(500L);
        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
        when(pedidoRepository.findById(500L)).thenReturn(Optional.of(pedido));

        assertThrows(BusinessValidationException.class, () -> pedidoService.actualizarEstadoPedido(500L, null));
        assertThrows(BusinessValidationException.class, () -> pedidoService.actualizarEstadoPedido(500L, " "));
        assertEquals(EstadoPedido.PENDIENTE_PAGO, pedido.getEstado());
        verify(pedidoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cancelar restituye el stock de cada línea del pedido")
    void cancelarRestituyeTodasLasLineas() {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(501L);
        pedido.setUsuario(cliente);
        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
        pedido.agregarDetalle(new DetallePedido(gpu, 2, gpu.getPrecio()));
        pedido.agregarDetalle(new DetallePedido(ram, 1, ram.getPrecio()));
        when(pedidoRepository.findById(501L)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(i -> i.getArgument(0));

        PedidoResponseDto cancelado = pedidoService.actualizarEstadoPedido(501L, "cancelado");

        assertEquals("CANCELADO", cancelado.estado());
        verify(productoRepository).restituirStock(1L, 2);
        verify(productoRepository).restituirStock(2L, 1);
    }

    @Test
    @DisplayName("Una transición inválida no restituye stock")
    void transicionInvalidaNoRestituye() {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(502L);
        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.agregarDetalle(new DetallePedido(gpu, 2, gpu.getPrecio()));
        when(pedidoRepository.findById(502L)).thenReturn(Optional.of(pedido));

        assertThrows(BusinessValidationException.class, () -> pedidoService.actualizarEstadoPedido(502L, "CANCELADO"));
        verify(productoRepository, never()).restituirStock(any(), any());
    }

    @Test
    @DisplayName("Debe permitir transiciones de estado válidas y restituir stock al cancelar un pedido")
    void debeRestituirStockAlCancelar() {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(500L);
        pedido.setUsuario(cliente);
        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
        pedido.agregarDetalle(new DetallePedido(gpu, 2, gpu.getPrecio()));

        when(pedidoRepository.findById(500L)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(i -> i.getArgument(0));

        PedidoResponseDto pagado = pedidoService.actualizarEstadoPedido(500L, "PAGADO");
        assertEquals("PAGADO", pagado.estado());

        PedidoResponseDto cancelado = pedidoService.actualizarEstadoPedido(500L, "CANCELADO");
        assertEquals("CANCELADO", cancelado.estado());
        verify(productoRepository, times(1)).restituirStock(1L, 2);
    }

    @Test
    @DisplayName("Cambio de estado inválido: debe rechazar transiciones no permitidas y estados inexistentes")
    void debeRechazarTransicionInvalida() {
        Pedido pedido = new Pedido();
        pedido.setIdPedido(500L);
        pedido.setEstado(EstadoPedido.CANCELADO);

        when(pedidoRepository.findById(500L)).thenReturn(Optional.of(pedido));

        //De CANCELADO a PAGADO (prohibido: estado terminal)
        assertThrows(BusinessValidationException.class, () ->
                pedidoService.actualizarEstadoPedido(500L, "PAGADO")
        );

        // Salto inválido: de PENDIENTE_PAGO directo a ENTREGADO
        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
        assertThrows(BusinessValidationException.class, () ->
                pedidoService.actualizarEstadoPedido(500L, "ENTREGADO")
        );

        // Estado desconocido
        assertThrows(BusinessValidationException.class, () ->
                pedidoService.actualizarEstadoPedido(500L, "ESTADO_INEXISTENTE")
        );

        verify(pedidoRepository, never()).save(any());
    }
}
