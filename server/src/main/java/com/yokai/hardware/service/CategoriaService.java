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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public CategoriaService(CategoriaRepository categoriaRepository, ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaDto> listarTodas() {
        List<Categoria> categorias = categoriaRepository.findAll();
        return categorias.stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public CategoriaDto obtenerPorId(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
        return mapToDto(categoria);
    }

    @Transactional
    public CategoriaDto crearCategoria(CrearCategoriaDto dto) {
        if (dto.nombre() == null || dto.nombre().isBlank()) {
            throw new BusinessValidationException("El nombre de la categoría es requerido.");
        }

        String nombreTrimmed = dto.nombre().trim();
        if (categoriaRepository.existsByNombreIgnoreCase(nombreTrimmed)) {
            throw new ConflictException("Ya existe una categoría con el nombre: " + nombreTrimmed);
        }

        Categoria categoria = new Categoria(
                nombreTrimmed,
                dto.subtitulo() != null && !dto.subtitulo().isBlank() ? dto.subtitulo().trim() : nombreTrimmed,
                dto.kanji() != null && !dto.kanji().isBlank() ? dto.kanji().trim() : "霊",
                dto.icono() != null && !dto.icono().isBlank() ? dto.icono().trim() : "memory",
                dto.acento() != null && !dto.acento().isBlank() ? dto.acento().trim() : "gold",
                dto.descripcion() != null ? dto.descripcion().trim() : ""
        );

        Categoria guardada = categoriaRepository.save(categoria);
        return mapToDto(guardada);
    }

    @Transactional
    public CategoriaDto actualizarCategoria(Long id, ActualizarCategoriaDto dto) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));

        if (dto.nombre() != null) {
            if (dto.nombre().isBlank()) {
                throw new BusinessValidationException("El nombre de la categoría no puede estar vacío.");
            }
            String nuevoNombre = dto.nombre().trim();
            if (!nuevoNombre.equalsIgnoreCase(categoria.getNombre()) && categoriaRepository.existsByNombreIgnoreCase(nuevoNombre)) {
                throw new ConflictException("Ya existe otra categoría con el nombre: " + nuevoNombre);
            }
            categoria.setNombre(nuevoNombre);
        }

        if (dto.subtitulo() != null) categoria.setSubtitulo(dto.subtitulo().trim());
        if (dto.kanji() != null) categoria.setKanji(dto.kanji().trim());
        if (dto.icono() != null) categoria.setIcono(dto.icono().trim());
        if (dto.acento() != null) categoria.setAcento(dto.acento().trim());
        if (dto.descripcion() != null) categoria.setDescripcion(dto.descripcion().trim());

        Categoria actualizada = categoriaRepository.save(categoria);
        return mapToDto(actualizada);
    }

    @Transactional
    public void eliminarCategoria(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));

        long count = productoRepository.countProductosByCategoriaId(categoria.getId());
        if (count > 0) {
            throw new ConflictException("No se puede eliminar la categoría porque contiene " + count + " productos asociados.");
        }

        categoriaRepository.delete(categoria);
    }

    private CategoriaDto mapToDto(Categoria cat) {
        long count = productoRepository.countByCategoriaId(cat.getId());
        return new CategoriaDto(
                cat.getId(),
                cat.getNombre(),
                cat.getNombre(),
                cat.getSubtitulo() != null ? cat.getSubtitulo() : cat.getNombre(),
                cat.getKanji() != null ? cat.getKanji() : "霊",
                cat.getIcono() != null ? cat.getIcono() : "memory",
                cat.getAcento() != null ? cat.getAcento() : "gold",
                cat.getDescripcion() != null ? cat.getDescripcion() : "",
                count,
                count
        );
    }
}
