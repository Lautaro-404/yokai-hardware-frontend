package com.yokai.hardware.service;

import com.yokai.hardware.dto.categoria.ActualizarCategoriaDto;
import com.yokai.hardware.dto.categoria.CategoriaDto;
import com.yokai.hardware.dto.categoria.CrearCategoriaDto;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ConflictException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.ProductoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private CategoriaService categoriaService;

    private Categoria categoriaOni;

    @BeforeEach
    void setUp() {
        categoriaOni = new Categoria(
                "Oni",
                "Placas de Video",
                "鬼",
                "sports_esports",
                "vermilion",
                "Tarjetas gráficas dedicadas de alto rendimiento"
        );
        categoriaOni.setId(1L);
    }

    @Test
    @DisplayName("listarTodas debe devolver la lista de categorías con conteo de modelos")
    void debeListarTodasLasCategorias() {
        when(categoriaRepository.findAll()).thenReturn(List.of(categoriaOni));
        when(productoRepository.countByCategoriaId(1L)).thenReturn(4L);

        List<CategoriaDto> resultado = categoriaService.listarTodas();

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("Oni", resultado.get(0).nombre());
        assertEquals("Placas de Video", resultado.get(0).subtitulo());
        assertEquals(4L, resultado.get(0).modelosCount());
    }

    @Test
    @DisplayName("obtenerPorId con ID existente debe devolver el DTO correspondiente")
    void debeObtenerCategoriaPorIdExistente() {
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaOni));
        when(productoRepository.countByCategoriaId(1L)).thenReturn(4L);

        CategoriaDto resultado = categoriaService.obtenerPorId(1L);

        assertNotNull(resultado);
        assertEquals(1L, resultado.id());
        assertEquals("Oni", resultado.nombre());
    }

    @Test
    @DisplayName("obtenerPorId con ID inexistente debe lanzar ResourceNotFoundException")
    void debeLanzarNotFoundAlObtenerCategoriaInexistente() {
        when(categoriaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoriaService.obtenerPorId(999L));
    }

    @Test
    @DisplayName("crearCategoria con datos válidos debe persistir y retornar DTO")
    void debeCrearCategoriaValida() {
        CrearCategoriaDto dto = new CrearCategoriaDto(
                "Tengu",
                "Memorias RAM",
                "天狗",
                "speed",
                "gold",
                "Módulos DDR5 veloces"
        );

        when(categoriaRepository.existsByNombreIgnoreCase("Tengu")).thenReturn(false);
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(invocation -> {
            Categoria c = invocation.getArgument(0);
            c.setId(3L);
            return c;
        });

        CategoriaDto creada = categoriaService.crearCategoria(dto);

        assertNotNull(creada);
        assertEquals(3L, creada.id());
        assertEquals("Tengu", creada.nombre());
        assertEquals("Memorias RAM", creada.subtitulo());
        verify(categoriaRepository).save(any(Categoria.class));
    }

    @Test
    @DisplayName("crearCategoria con nombre repetido debe lanzar ConflictException")
    void debeRechazarCrearCategoriaConNombreDuplicado() {
        CrearCategoriaDto dto = new CrearCategoriaDto("ONI", "GPUs", "鬼", "memory", "gold", "Desc");
        when(categoriaRepository.existsByNombreIgnoreCase("ONI")).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class, () -> categoriaService.crearCategoria(dto));
        assertTrue(ex.getMessage().contains("Ya existe una categoría"));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    @DisplayName("crearCategoria con nombre vacío o en blanco debe lanzar BusinessValidationException")
    void debeRechazarCrearCategoriaConNombreVacio() {
        CrearCategoriaDto dtoVacio = new CrearCategoriaDto("   ", "Sub", "鬼", "memory", "gold", "Desc");

        assertThrows(BusinessValidationException.class, () -> categoriaService.crearCategoria(dtoVacio));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    @DisplayName("actualizarCategoria con datos válidos debe modificar campos y retornar DTO")
    void debeActualizarCategoriaValida() {
        ActualizarCategoriaDto dto = new ActualizarCategoriaDto(
                "Oni Extreme",
                "GPUs Entusiastas",
                "鬼",
                "sports_esports",
                "vermilion",
                "Nueva descripción"
        );

        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaOni));
        when(categoriaRepository.existsByNombreIgnoreCase("Oni Extreme")).thenReturn(false);
        when(categoriaRepository.save(any(Categoria.class))).thenReturn(categoriaOni);

        CategoriaDto actualizada = categoriaService.actualizarCategoria(1L, dto);

        assertNotNull(actualizada);
        assertEquals("Oni Extreme", categoriaOni.getNombre());
        assertEquals("GPUs Entusiastas", categoriaOni.getSubtitulo());
        verify(categoriaRepository).save(categoriaOni);
    }

    @Test
    @DisplayName("actualizarCategoria manteniendo su mismo nombre no debe lanzar conflicto")
    void debePermitirActualizarCategoriaManteniendoMismoNombre() {
        ActualizarCategoriaDto dto = new ActualizarCategoriaDto(
                "ONI", // Mismo nombre en mayúsculas
                "Nuevo Subtítulo",
                null,
                null,
                null,
                null
        );

        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaOni));
        when(categoriaRepository.save(any(Categoria.class))).thenReturn(categoriaOni);

        assertDoesNotThrow(() -> categoriaService.actualizarCategoria(1L, dto));
        verify(categoriaRepository, never()).existsByNombreIgnoreCase(any());
    }

    @Test
    @DisplayName("actualizarCategoria con nombre duplicado en otra categoría debe lanzar ConflictException")
    void debeRechazarActualizarCategoriaConNombreDeOtra() {
        ActualizarCategoriaDto dto = new ActualizarCategoriaDto(
                "Kitsune",
                "CPUs",
                null,
                null,
                null,
                null
        );

        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaOni));
        when(categoriaRepository.existsByNombreIgnoreCase("Kitsune")).thenReturn(true);

        assertThrows(ConflictException.class, () -> categoriaService.actualizarCategoria(1L, dto));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    @DisplayName("actualizarCategoria con nombre en blanco debe lanzar BusinessValidationException")
    void debeRechazarActualizarCategoriaConNombreEnBlanco() {
        ActualizarCategoriaDto dto = new ActualizarCategoriaDto(
                "   ",
                "CPUs",
                null,
                null,
                null,
                null
        );

        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaOni));

        assertThrows(BusinessValidationException.class, () -> categoriaService.actualizarCategoria(1L, dto));
        verify(categoriaRepository, never()).save(any());
    }

    @Test
    @DisplayName("eliminarCategoria sin productos asociados debe ejecutar borrado")
    void debeEliminarCategoriaSinProductos() {
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaOni));
        when(productoRepository.countProductosByCategoriaId(1L)).thenReturn(0L);

        categoriaService.eliminarCategoria(1L);

        verify(categoriaRepository).delete(categoriaOni);
    }

    @Test
    @DisplayName("eliminarCategoria con productos asociados debe lanzar ConflictException (409)")
    void debeRechazarEliminarCategoriaConProductosAsociados() {
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(categoriaOni));
        when(productoRepository.countProductosByCategoriaId(1L)).thenReturn(5L);

        ConflictException ex = assertThrows(ConflictException.class, () -> categoriaService.eliminarCategoria(1L));
        assertTrue(ex.getMessage().contains("contiene 5 productos asociados"));
        verify(categoriaRepository, never()).delete(any());
    }

    @Test
    @DisplayName("eliminarCategoria con ID inexistente debe lanzar ResourceNotFoundException")
    void debeLanzarNotFoundAlEliminarCategoriaInexistente() {
        when(categoriaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoriaService.eliminarCategoria(999L));
        verify(categoriaRepository, never()).delete(any());
    }
}
