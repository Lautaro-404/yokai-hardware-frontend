package com.yokai.hardware.service;

import com.yokai.hardware.dto.marca.ActualizarMarcaDto;
import com.yokai.hardware.dto.marca.CrearMarcaDto;
import com.yokai.hardware.dto.marca.MarcaDto;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ConflictException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.repository.MarcaRepository;
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
class MarcaServiceTest {

    @Mock
    private MarcaRepository marcaRepository;

    @Mock
    private ProductoRepository productoRepository;

    @InjectMocks
    private MarcaService marcaService;

    private Marca marcaAsus;

    @BeforeEach
    void setUp() {
        marcaAsus = new Marca("ASUS");
        marcaAsus.setId(1L);
    }

    @Test
    @DisplayName("listarTodas debe devolver la lista de marcas mapeadas")
    void debeListarTodasLasMarcas() {
        when(marcaRepository.findAll()).thenReturn(List.of(marcaAsus));

        List<MarcaDto> resultado = marcaService.listarTodas();

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals(1L, resultado.get(0).id());
        assertEquals("ASUS", resultado.get(0).nombre());
    }

    @Test
    @DisplayName("obtenerPorId con ID existente debe devolver el DTO de la marca")
    void debeObtenerMarcaPorIdExistente() {
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaAsus));

        MarcaDto resultado = marcaService.obtenerPorId(1L);

        assertNotNull(resultado);
        assertEquals(1L, resultado.id());
        assertEquals("ASUS", resultado.nombre());
    }

    @Test
    @DisplayName("obtenerPorId con ID inexistente debe lanzar ResourceNotFoundException")
    void debeLanzarNotFoundAlObtenerMarcaInexistente() {
        when(marcaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> marcaService.obtenerPorId(999L));
    }

    @Test
    @DisplayName("crearMarca con nombre válido debe persistir y retornar DTO")
    void debeCrearMarcaValida() {
        CrearMarcaDto dto = new CrearMarcaDto("Gigabyte");
        when(marcaRepository.existsByNombreIgnoreCase("Gigabyte")).thenReturn(false);
        when(marcaRepository.save(any(Marca.class))).thenAnswer(invocation -> {
            Marca m = invocation.getArgument(0);
            m.setId(2L);
            return m;
        });

        MarcaDto creada = marcaService.crearMarca(dto);

        assertNotNull(creada);
        assertEquals(2L, creada.id());
        assertEquals("Gigabyte", creada.nombre());
        verify(marcaRepository).save(any(Marca.class));
    }

    @Test
    @DisplayName("crearMarca con nombre repetido (case-insensitive) debe lanzar ConflictException")
    void debeRechazarCrearMarcaConNombreDuplicado() {
        CrearMarcaDto dto = new CrearMarcaDto("asus");
        when(marcaRepository.existsByNombreIgnoreCase("asus")).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class, () -> marcaService.crearMarca(dto));
        assertTrue(ex.getMessage().contains("Ya existe una marca con el nombre: asus"));
        verify(marcaRepository, never()).save(any());
    }

    @Test
    @DisplayName("crearMarca con nombre vacío o en blanco debe lanzar BusinessValidationException")
    void debeRechazarCrearMarcaConNombreVacio() {
        CrearMarcaDto dtoVacio = new CrearMarcaDto("   ");

        assertThrows(BusinessValidationException.class, () -> marcaService.crearMarca(dtoVacio));
        verify(marcaRepository, never()).save(any());
    }

    @Test
    @DisplayName("actualizarMarca con nombre válido debe modificar y retornar DTO")
    void debeActualizarMarcaValida() {
        ActualizarMarcaDto dto = new ActualizarMarcaDto("ASUS ROG");
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaAsus));
        when(marcaRepository.existsByNombreIgnoreCase("ASUS ROG")).thenReturn(false);
        when(marcaRepository.save(any(Marca.class))).thenReturn(marcaAsus);

        MarcaDto actualizada = marcaService.actualizarMarca(1L, dto);

        assertNotNull(actualizada);
        assertEquals("ASUS ROG", marcaAsus.getNombre());
        verify(marcaRepository).save(marcaAsus);
    }

    @Test
    @DisplayName("actualizarMarca manteniendo el mismo nombre no debe lanzar conflicto")
    void debePermitirActualizarMarcaManteniendoMismoNombre() {
        ActualizarMarcaDto dto = new ActualizarMarcaDto("asus"); // Mismo nombre en minúscula
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaAsus));
        when(marcaRepository.save(any(Marca.class))).thenReturn(marcaAsus);

        assertDoesNotThrow(() -> marcaService.actualizarMarca(1L, dto));
        verify(marcaRepository, never()).existsByNombreIgnoreCase(any());
    }

    @Test
    @DisplayName("actualizarMarca con nombre repetido en otra marca debe lanzar ConflictException")
    void debeRechazarActualizarMarcaConNombreDeOtra() {
        ActualizarMarcaDto dto = new ActualizarMarcaDto("Corsair");
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaAsus));
        when(marcaRepository.existsByNombreIgnoreCase("Corsair")).thenReturn(true);

        assertThrows(ConflictException.class, () -> marcaService.actualizarMarca(1L, dto));
        verify(marcaRepository, never()).save(any());
    }

    @Test
    @DisplayName("actualizarMarca con nombre vacío debe lanzar BusinessValidationException")
    void debeRechazarActualizarMarcaConNombreVacio() {
        ActualizarMarcaDto dtoVacio = new ActualizarMarcaDto("   ");
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaAsus));

        assertThrows(BusinessValidationException.class, () -> marcaService.actualizarMarca(1L, dtoVacio));
        verify(marcaRepository, never()).save(any());
    }

    @Test
    @DisplayName("eliminarMarca sin productos asociados debe ejecutar borrado")
    void debeEliminarMarcaSinProductos() {
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaAsus));
        when(productoRepository.countProductosByMarcaId(1L)).thenReturn(0L);

        marcaService.eliminarMarca(1L);

        verify(marcaRepository).delete(marcaAsus);
    }

    @Test
    @DisplayName("eliminarMarca con productos asociados debe lanzar ConflictException (409)")
    void debeRechazarEliminarMarcaConProductosAsociados() {
        when(marcaRepository.findById(1L)).thenReturn(Optional.of(marcaAsus));
        when(productoRepository.countProductosByMarcaId(1L)).thenReturn(3L);

        ConflictException ex = assertThrows(ConflictException.class, () -> marcaService.eliminarMarca(1L));
        assertTrue(ex.getMessage().contains("contiene 3 productos asociados"));
        verify(marcaRepository, never()).delete(any());
    }

    @Test
    @DisplayName("eliminarMarca con ID inexistente debe lanzar ResourceNotFoundException")
    void debeLanzarNotFoundAlEliminarMarcaInexistente() {
        when(marcaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> marcaService.eliminarMarca(999L));
        verify(marcaRepository, never()).delete(any());
    }
}
