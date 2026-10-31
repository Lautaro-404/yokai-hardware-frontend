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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarcaService {

    private final MarcaRepository marcaRepository;
    private final ProductoRepository productoRepository;

    public MarcaService(MarcaRepository marcaRepository, ProductoRepository productoRepository) {
        this.marcaRepository = marcaRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional(readOnly = true)
    public List<MarcaDto> listarTodas() {
        return marcaRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public MarcaDto obtenerPorId(Long id) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada con ID: " + id));
        return mapToDto(marca);
    }

    @Transactional
    public MarcaDto crearMarca(CrearMarcaDto dto) {
        if (dto.nombre() == null || dto.nombre().isBlank()) {
            throw new BusinessValidationException("El nombre de la marca es requerido.");
        }

        String nombreTrimmed = dto.nombre().trim();
        if (marcaRepository.existsByNombreIgnoreCase(nombreTrimmed)) {
            throw new ConflictException("Ya existe una marca con el nombre: " + nombreTrimmed);
        }

        Marca marca = new Marca(nombreTrimmed);
        Marca guardada = marcaRepository.save(marca);
        return mapToDto(guardada);
    }

    @Transactional
    public MarcaDto actualizarMarca(Long id, ActualizarMarcaDto dto) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada con ID: " + id));

        if (dto.nombre() == null || dto.nombre().isBlank()) {
            throw new BusinessValidationException("El nombre de la marca no puede estar vacío.");
        }

        String nuevoNombre = dto.nombre().trim();
        if (!nuevoNombre.equalsIgnoreCase(marca.getNombre()) && marcaRepository.existsByNombreIgnoreCase(nuevoNombre)) {
            throw new ConflictException("Ya existe otra marca con el nombre: " + nuevoNombre);
        }

        marca.setNombre(nuevoNombre);
        Marca actualizada = marcaRepository.save(marca);
        return mapToDto(actualizada);
    }

    @Transactional
    public void eliminarMarca(Long id) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca no encontrada con ID: " + id));

        long count = productoRepository.countProductosByMarcaId(marca.getId());
        if (count > 0) {
            throw new ConflictException("No se puede eliminar la marca porque contiene " + count + " productos asociados.");
        }

        marcaRepository.delete(marca);
    }

    private MarcaDto mapToDto(Marca m) {
        return new MarcaDto(m.getId(), m.getNombre());
    }
}
