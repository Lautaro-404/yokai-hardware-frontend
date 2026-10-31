package com.yokai.hardware.service;

import com.yokai.hardware.dto.producto.ActualizarProductoDto;
import com.yokai.hardware.dto.producto.ProductoCardDto;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.ProductoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepository;
    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private MarcaRepository marcaRepository;

    @InjectMocks
    private ProductoService productoService;

    private Producto producto(int stock, int stockMinimo) {
        Producto p = new Producto();
        p.setSku("SKU-1");
        p.setNombre("Producto");
        p.setPrecio(new BigDecimal("100.00"));
        p.setStock(stock);
        p.setStockMinimo(stockMinimo);
        p.setCategoria(new Categoria());
        p.setMarca(new Marca("ASUS"));
        return p;
    }

    @Test
    @DisplayName("el DTO expone 'En stock' cuando el stock supera el minimo")
    void dtoEnStock() {
        ProductoCardDto dto = productoService.mapToCardDto(producto(10, 3));
        assertEquals("En stock", dto.estadoStock());
    }

    @Test
    @DisplayName("el DTO expone 'Últimas unidades' cuando el stock es menor o igual al minimo")
    void dtoUltimasUnidades() {
        ProductoCardDto dto = productoService.mapToCardDto(producto(3, 3));
        assertEquals("Últimas unidades", dto.estadoStock());
    }

    @Test
    @DisplayName("el DTO expone 'Sin stock' cuando el stock es cero")
    void dtoSinStock() {
        ProductoCardDto dto = productoService.mapToCardDto(producto(0, 3));
        assertEquals("Sin stock", dto.estadoStock());
    }

    @Test
    @DisplayName("el DTO expone 'En stock' con una unidad cuando el mínimo es cero")
    void dtoUnaUnidadMinimoCero() {
        assertEquals("En stock", productoService.mapToCardDto(producto(1, 0)).estadoStock());
    }

    @Test
    @DisplayName("el DTO cambia de 'Últimas unidades' a 'En stock' al superar el mínimo en una unidad")
    void dtoJustoPorDebajoDelMinimo() {
        assertEquals("Últimas unidades", productoService.mapToCardDto(producto(2, 3)).estadoStock());
        assertEquals("En stock", productoService.mapToCardDto(producto(4, 3)).estadoStock());
    }

    @Test
    @DisplayName("actualizar el stock con un valor negativo lo deja en cero (nunca negativo)")
    void actualizarStockNegativoSeAcotaACero() {
        Producto p = producto(5, 2);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(p));
        when(productoRepository.save(any(Producto.class))).thenAnswer(i -> i.getArgument(0));

        ProductoCardDto dto = productoService.actualizarProducto(1L,
                new ActualizarProductoDto(null, null, null, null, -7, -1, null, null, null, null, null, null));

        assertEquals(0, p.getStock());
        assertEquals(0, p.getStockMinimo());
        assertEquals("Sin stock", dto.estadoStock());
    }

    @Test
    @DisplayName("la alerta de stock bajo devuelve lo que informa el repositorio")
    void alertaStockBajo() {
        when(productoRepository.findProductosConStockBajo()).thenReturn(List.of(producto(0, 3), producto(3, 3)));

        List<ProductoCardDto> alertas = productoService.obtenerProductosConStockBajo();

        assertEquals(2, alertas.size());
        assertEquals("Sin stock", alertas.get(0).estadoStock());
        assertEquals("Últimas unidades", alertas.get(1).estadoStock());
    }

    @Test
    @DisplayName("rechaza una disponibilidad desconocida sin consultar la base")
    void disponibilidadInvalida() {
        assertThrows(BusinessValidationException.class, () ->
                productoService.buscarProductos(null, null, null, null, null, "AGOTADO", null, 0, 8));
        verifyNoInteractions(productoRepository);
    }

    @Test
    @DisplayName("rechaza un rango de precio invertido")
    void rangoDePrecioInvertido() {
        assertThrows(BusinessValidationException.class, () ->
                productoService.buscarProductos(null, null, new BigDecimal("500"), new BigDecimal("100"),
                        null, null, null, 0, 8));
        verifyNoInteractions(productoRepository);
    }
}
