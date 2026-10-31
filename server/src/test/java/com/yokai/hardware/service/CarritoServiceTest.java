package com.yokai.hardware.service;

import com.yokai.hardware.dto.carrito.CarritoDto;
import com.yokai.hardware.dto.carrito.CarritoItemRequestDto;
import com.yokai.hardware.entity.CarritoItem;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.exception.StockConflictException;
import com.yokai.hardware.repository.CarritoItemRepository;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.ProductoRepository;
import com.yokai.hardware.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarritoServiceTest {

    @Mock private CarritoItemRepository carritoItemRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CategoriaRepository categoriaRepository;
    @Mock private MarcaRepository marcaRepository;

    private CarritoService carritoService;
    private Usuario usuario;
    private Producto producto;

    @BeforeEach
    void setUp() {
        ProductoService productoService = new ProductoService(productoRepository, categoriaRepository, marcaRepository);
        carritoService = new CarritoService(carritoItemRepository, productoRepository, usuarioRepository, productoService);

        usuario = new Usuario("Martin", "martin@yokai.com", "pass", "CLIENTE");
        usuario.setId(1L);

        producto = new Producto();
        producto.setId(10L);
        producto.setNombre("Ryzen 7 7800X3D");
        producto.setPrecio(new BigDecimal("1000.00"));
        producto.setStock(4);
        producto.setStockMinimo(1);
        producto.setCategoria(new Categoria("Kitsune", "CPUs"));
        producto.setMarca(new Marca("AMD"));
    }

    private CarritoItem itemDe(Usuario dueno, int cantidad) {
        CarritoItem item = new CarritoItem(dueno, producto, cantidad);
        item.setId(100L);
        return item;
    }

    @Test
    @DisplayName("agregar un producto nuevo crea un item con la cantidad pedida")
    void agregarNuevo() {
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(carritoItemRepository.findByUsuarioIdAndProductoId(1L, 10L)).thenReturn(Optional.empty());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of());

        carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 2));

        ArgumentCaptor<CarritoItem> captor = ArgumentCaptor.forClass(CarritoItem.class);
        verify(carritoItemRepository).save(captor.capture());
        assertEquals(2, captor.getValue().getCantidad());
    }

    @Test
    @DisplayName("agregar un producto ya presente suma la cantidad en el mismo item")
    void agregarSuma() {
        CarritoItem existente = itemDe(usuario, 1);
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(carritoItemRepository.findByUsuarioIdAndProductoId(1L, 10L)).thenReturn(Optional.of(existente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of(existente));

        CarritoDto carrito = carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 2));

        assertEquals(3, existente.getCantidad());
        verify(carritoItemRepository, times(1)).save(existente);
        assertEquals(1, carrito.items().size());
    }

    @Test
    @DisplayName("superar el stock al agregar o sumar lanza StockConflictException y no guarda")
    void agregarSuperaStock() {
        CarritoItem existente = itemDe(usuario, 3);
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(carritoItemRepository.findByUsuarioIdAndProductoId(1L, 10L)).thenReturn(Optional.of(existente));

        assertThrows(StockConflictException.class,
                () -> carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 2)));
        assertEquals(3, existente.getCantidad());
        verify(carritoItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("cambiar cantidad por encima del stock lanza StockConflictException")
    void cambiarCantidadSuperaStock() {
        CarritoItem item = itemDe(usuario, 1);
        when(carritoItemRepository.findById(100L)).thenReturn(Optional.of(item));

        assertThrows(StockConflictException.class, () -> carritoService.cambiarCantidad(1L, 100L, 5));
        verify(carritoItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("modificar o eliminar un item de otro usuario lanza AccessDeniedException")
    void itemAjeno() {
        Usuario otro = new Usuario("Otro", "otro@yokai.com", "pass", "CLIENTE");
        otro.setId(2L);
        when(carritoItemRepository.findById(100L)).thenReturn(Optional.of(itemDe(otro, 1)));

        assertThrows(AccessDeniedException.class, () -> carritoService.cambiarCantidad(1L, 100L, 2));
        assertThrows(AccessDeniedException.class, () -> carritoService.eliminarItem(1L, 100L));
        verify(carritoItemRepository, never()).save(any());
        verify(carritoItemRepository, never()).delete(any());
    }

    @Test
    @DisplayName("agregar exactamente el stock disponible es válido (stock justo)")
    void agregarStockJusto() {
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(carritoItemRepository.findByUsuarioIdAndProductoId(1L, 10L)).thenReturn(Optional.empty());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of());

        carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 4));

        ArgumentCaptor<CarritoItem> captor = ArgumentCaptor.forClass(CarritoItem.class);
        verify(carritoItemRepository).save(captor.capture());
        assertEquals(4, captor.getValue().getCantidad());
    }

    @Test
    @DisplayName("agregar un producto nuevo con una unidad más que el stock lanza StockConflictException")
    void agregarNuevoSuperaStockPorUno() {
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(carritoItemRepository.findByUsuarioIdAndProductoId(1L, 10L)).thenReturn(Optional.empty());

        assertThrows(StockConflictException.class,
                () -> carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 5)));
        verify(carritoItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("sumar hasta llegar justo al stock disponible es válido")
    void sumarHastaStockJusto() {
        CarritoItem existente = itemDe(usuario, 3);
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(carritoItemRepository.findByUsuarioIdAndProductoId(1L, 10L)).thenReturn(Optional.of(existente));
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of(existente));

        carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 1));

        assertEquals(4, existente.getCantidad());
        verify(carritoItemRepository).save(existente);
    }

    @Test
    @DisplayName("un producto sin stock (cero o nulo) no se puede agregar")
    void agregarProductoSinStock() {
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(carritoItemRepository.findByUsuarioIdAndProductoId(1L, 10L)).thenReturn(Optional.empty());

        producto.setStock(0);
        assertThrows(StockConflictException.class,
                () -> carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 1)));

        producto.setStock(null);
        assertThrows(StockConflictException.class,
                () -> carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 1)));
        verify(carritoItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("agregar un producto inexistente lanza ResourceNotFoundException")
    void agregarProductoInexistente() {
        when(productoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> carritoService.agregarItem(1L, new CarritoItemRequestDto(99L, 1)));
        verify(carritoItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("agregar con cantidad cero o negativa se rechaza sin guardar")
    void agregarCantidadInvalida() {
        assertThrows(BusinessValidationException.class,
                () -> carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, 0)));
        assertThrows(BusinessValidationException.class,
                () -> carritoService.agregarItem(1L, new CarritoItemRequestDto(10L, -2)));
        verify(carritoItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("cambiar la cantidad a cero o negativa se rechaza y no modifica el item")
    void cambiarCantidadInvalida() {
        CarritoItem item = itemDe(usuario, 2);

        assertThrows(BusinessValidationException.class, () -> carritoService.cambiarCantidad(1L, 100L, 0));
        assertThrows(BusinessValidationException.class, () -> carritoService.cambiarCantidad(1L, 100L, -1));
        assertEquals(2, item.getCantidad());
        verify(carritoItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("cambiar la cantidad a exactamente el stock disponible es válido")
    void cambiarCantidadStockJusto() {
        CarritoItem item = itemDe(usuario, 1);
        when(carritoItemRepository.findById(100L)).thenReturn(Optional.of(item));
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of(item));

        CarritoDto carrito = carritoService.cambiarCantidad(1L, 100L, 4);

        assertEquals(4, item.getCantidad());
        assertEquals(new BigDecimal("4000.00"), carrito.total());
        verify(carritoItemRepository).save(item);
    }

    @Test
    @DisplayName("cambiar o eliminar un item inexistente lanza ResourceNotFoundException")
    void itemInexistente() {
        when(carritoItemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> carritoService.cambiarCantidad(1L, 999L, 1));
        assertThrows(ResourceNotFoundException.class, () -> carritoService.eliminarItem(1L, 999L));
        verify(carritoItemRepository, never()).delete(any());
    }

    @Test
    @DisplayName("eliminar un item propio lo borra del repositorio")
    void eliminarItemPropio() {
        CarritoItem item = itemDe(usuario, 2);
        when(carritoItemRepository.findById(100L)).thenReturn(Optional.of(item));
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of());

        CarritoDto carrito = carritoService.eliminarItem(1L, 100L);

        verify(carritoItemRepository).delete(item);
        assertTrue(carrito.items().isEmpty());
    }

    @Test
    @DisplayName("vaciar el carrito solo borra los items del usuario indicado")
    void vaciarSoloPropio() {
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of());

        carritoService.vaciarCarrito(1L);

        verify(carritoItemRepository).deleteAllByUsuarioId(1L);
        verify(carritoItemRepository, never()).deleteAllByUsuarioId(2L);
    }

    @Test
    @DisplayName("un carrito vacío devuelve total cero y cantidad cero")
    void carritoVacio() {
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of());

        CarritoDto carrito = carritoService.obtenerCarrito(1L);

        assertTrue(carrito.items().isEmpty());
        assertEquals(0, carrito.cantidadTotal());
        assertEquals(0, BigDecimal.ZERO.compareTo(carrito.total()));
    }

    @Test
    @DisplayName("obtener el carrito consulta únicamente los items del usuario autenticado")
    void obtenerSoloItemsPropios() {
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of());

        carritoService.obtenerCarrito(1L);

        verify(carritoItemRepository).findByUsuarioIdWithProducto(1L);
        verify(carritoItemRepository, never()).findByUsuarioIdWithProducto(2L);
    }

    @Test
    @DisplayName("el carrito calcula subtotales y total en el servidor")
    void totales() {
        Producto otro = new Producto();
        otro.setId(11L);
        otro.setNombre("RAM");
        otro.setPrecio(new BigDecimal("250.50"));
        otro.setStock(10);
        otro.setStockMinimo(1);
        otro.setCategoria(new Categoria("Tengu", "RAM"));
        otro.setMarca(new Marca("Kingston"));
        CarritoItem i1 = itemDe(usuario, 3);
        CarritoItem i2 = new CarritoItem(usuario, otro, 2);
        i2.setId(101L);
        when(carritoItemRepository.findByUsuarioIdWithProducto(1L)).thenReturn(List.of(i1, i2));

        CarritoDto carrito = carritoService.obtenerCarrito(1L);

        assertEquals(new BigDecimal("3000.00"), carrito.items().get(0).subtotal());
        assertEquals(new BigDecimal("501.00"), carrito.items().get(1).subtotal());
        assertEquals(new BigDecimal("3501.00"), carrito.total());
        assertEquals(5, carrito.cantidadTotal());
    }
}
