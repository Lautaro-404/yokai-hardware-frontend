package com.yokai.hardware.service;

import com.yokai.hardware.dto.producto.ActualizarProductoDto;
import com.yokai.hardware.dto.producto.CrearProductoDto;
import com.yokai.hardware.dto.producto.PageResponseDto;
import com.yokai.hardware.dto.producto.ProductoCardDto;
import com.yokai.hardware.dto.producto.ProductoDetalleDto;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.ProductoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ProductoService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final List<String> FILTROS_DISPONIBILIDAD =
            List.of("EN_STOCK", "ULTIMAS_UNIDADES", "SIN_STOCK", "DISPONIBLE");

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final MarcaRepository marcaRepository;

    public ProductoService(
            ProductoRepository productoRepository,
            CategoriaRepository categoriaRepository,
            MarcaRepository marcaRepository
    ) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.marcaRepository = marcaRepository;
    }

    @Transactional(readOnly = true)
    public PageResponseDto<ProductoCardDto> buscarProductos(
            String categoria,
            String marca,
            BigDecimal precioMin,
            BigDecimal precioMax,
            String q,
            String disponibilidad,
            String orden,
            int page,
            int size
    ) {
        if (precioMin != null && precioMax != null && precioMin.compareTo(precioMax) > 0) {
            throw new BusinessValidationException("El precio minimo no puede ser mayor al precio maximo");
        }
        String filtroDisponibilidad = normalizarDisponibilidad(disponibilidad);
        int pageSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        int pageIndex = Math.max(0, page);

        Sort sort = switch (orden != null ? orden : "") {
            case "precio_asc" -> Sort.by("precio").ascending();
            case "precio_desc" -> Sort.by("precio").descending();
            case "nombre_asc" -> Sort.by("nombre").ascending();
            case "stock_desc" -> Sort.by("stock").descending();
            default -> Sort.by("id").descending();
        };

        Pageable pageable = PageRequest.of(pageIndex, pageSize, sort);
        Page<Producto> productosPage = productoRepository.buscarCatalogo(
                categoria != null ? categoria.trim() : null,
                marca != null ? marca.trim() : null,
                precioMin,
                precioMax,
                q != null ? q.trim() : null,
                filtroDisponibilidad,
                pageable
        );

        Page<ProductoCardDto> dtoPage = productosPage.map(this::mapToCardDto);
        return PageResponseDto.fromPage(dtoPage);
    }

    @Transactional(readOnly = true)
    public ProductoDetalleDto obtenerPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        return ProductoDetalleDto.desde(mapToCardDto(producto));
    }

    @Transactional
    public ProductoCardDto crearProducto(CrearProductoDto dto) {
        Categoria categoria = categoriaRepository.findByNombreIgnoreCase(dto.categoria().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada: " + dto.categoria()));

        Marca marca = marcaRepository.findByNombreIgnoreCase(dto.marca().trim())
                .orElseGet(() -> marcaRepository.save(new Marca(dto.marca().trim())));

        String sku = (dto.sku() != null && !dto.sku().isBlank())
                ? dto.sku().trim().toUpperCase()
                : generarSku(categoria.getNombre());

        if (productoRepository.existsBySku(sku)) {
            throw new BusinessValidationException("Ya existe un producto con el SKU: " + sku);
        }

        Map<String, Object> specs = new HashMap<>();
        if (dto.especificaciones() != null) {
            specs.putAll(dto.especificaciones());
        }

        // Validación preventiva para satisfacer el trigger PostgreSQL de especificaciones técnicas
        asegurarEspecificacionesMinimas(categoria.getNombre(), specs);

        if (dto.subtituloCorto() != null && !dto.subtituloCorto().isBlank()) {
            specs.put("subtituloCorto", dto.subtituloCorto().trim());
        }

        Producto producto = new Producto();
        producto.setSku(sku);
        producto.setNombre(dto.nombre().trim());
        producto.setDescripcion(dto.descripcion() != null ? dto.descripcion().trim() : "");
        producto.setPrecio(dto.precio());
        producto.setStock(dto.stock() != null ? dto.stock() : 0);
        producto.setStockMinimo(dto.stockMinimo() != null ? dto.stockMinimo() : 3);
        producto.setCategoria(categoria);
        producto.setMarca(marca);
        producto.setImagenUrl(dto.imagen() != null ? dto.imagen().trim() : null);
        producto.setDestacado(Boolean.TRUE.equals(dto.destacado()));
        producto.setActivo(true);
        producto.setEspecificaciones(specs);

        Producto guardado = productoRepository.save(producto);
        return mapToCardDto(guardado);
    }

    @Transactional
    public ProductoCardDto actualizarProducto(Long id, ActualizarProductoDto dto) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));

        if (dto.nombre() != null && !dto.nombre().isBlank()) {
            producto.setNombre(dto.nombre().trim());
        }
        if (dto.descripcion() != null) {
            producto.setDescripcion(dto.descripcion().trim());
        }
        if (dto.precio() != null) {
            producto.setPrecio(dto.precio());
        }
        if (dto.stock() != null) {
            producto.setStock(Math.max(0, dto.stock()));
        }
        if (dto.stockMinimo() != null) {
            producto.setStockMinimo(Math.max(0, dto.stockMinimo()));
        }
        if (dto.imagen() != null) {
            producto.setImagenUrl(dto.imagen().trim());
        }
        if (dto.destacado() != null) {
            producto.setDestacado(dto.destacado());
        }

        if (dto.categoria() != null && !dto.categoria().isBlank()) {
            Categoria cat = categoriaRepository.findByNombreIgnoreCase(dto.categoria().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada: " + dto.categoria()));
            producto.setCategoria(cat);
        }

        if (dto.marca() != null && !dto.marca().isBlank()) {
            Marca m = marcaRepository.findByNombreIgnoreCase(dto.marca().trim())
                    .orElseGet(() -> marcaRepository.save(new Marca(dto.marca().trim())));
            producto.setMarca(m);
        }

        Map<String, Object> currentSpecs = producto.getEspecificaciones() != null
                ? new HashMap<>(producto.getEspecificaciones())
                : new HashMap<>();

        if (dto.especificaciones() != null) {
            currentSpecs.putAll(dto.especificaciones());
        }
        if (dto.subtituloCorto() != null) {
            currentSpecs.put("subtituloCorto", dto.subtituloCorto().trim());
        }

        asegurarEspecificacionesMinimas(producto.getCategoria().getNombre(), currentSpecs);
        producto.setEspecificaciones(currentSpecs);

        Producto actualizado = productoRepository.save(producto);
        return mapToCardDto(actualizado);
    }

    @Transactional(readOnly = true)
    public List<ProductoCardDto> obtenerProductosConStockBajo() {
        return productoRepository.findProductosConStockBajo()
                .stream()
                .map(this::mapToCardDto)
                .toList();
    }

    @Transactional
    public void eliminarProducto(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + id));
        // Soft Delete conforme a AGENTS.md
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    public ProductoCardDto mapToCardDto(Producto p) {
        String estadoStockCalculado = p.getEstadoStock().getEtiqueta();

        String catNombre = p.getCategoria() != null ? p.getCategoria().getNombre() : "Hardware";
        String marcaNombre = p.getMarca() != null ? p.getMarca().getNombre() : "Genérico";

        Map<String, Object> specs = p.getEspecificaciones() != null ? p.getEspecificaciones() : Map.of();
        String subtituloCorto = specs.containsKey("subtituloCorto")
                ? String.valueOf(specs.get("subtituloCorto"))
                : (p.getDescripcion() != null && p.getDescripcion().length() > 60
                        ? p.getDescripcion().substring(0, 57) + "..."
                        : p.getDescripcion());

        String etiquetaYokai = specs.containsKey("etiquetaYokai")
                ? String.valueOf(specs.get("etiquetaYokai"))
                : catNombre + " // " + marcaNombre;

        return new ProductoCardDto(
                p.getId(),
                p.getSku(),
                p.getNombre(),
                p.getDescripcion(),
                p.getPrecio(),
                p.getStock(),
                p.getStockMinimo(),
                estadoStockCalculado,
                p.getImagenUrl(),
                catNombre,
                marcaNombre,
                etiquetaYokai,
                subtituloCorto,
                p.getDestacado(),
                specs
        );
    }

    private String normalizarDisponibilidad(String disponibilidad) {
        if (disponibilidad == null || disponibilidad.isBlank()) {
            return null;
        }
        String valor = disponibilidad.trim().toUpperCase();
        if (!FILTROS_DISPONIBILIDAD.contains(valor)) {
            throw new BusinessValidationException(
                    "Disponibilidad invalida: " + disponibilidad + ". Valores permitidos: " + FILTROS_DISPONIBILIDAD);
        }
        return valor;
    }

    private String generarSku(String categoriaNombre) {
        String prefix = categoriaNombre != null && categoriaNombre.length() >= 3
                ? categoriaNombre.substring(0, 3).toUpperCase()
                : "PRD";
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void asegurarEspecificacionesMinimas(String catNombre, Map<String, Object> specs) {
        if (catNombre == null) return;
        String catLower = catNombre.toLowerCase();

        if (catLower.contains("oni") || catLower.contains("gpu") || catLower.contains("video")) {
            if (!specs.containsKey("tdp_w")) specs.put("tdp_w", 200);
            if (!specs.containsKey("length_mm")) specs.put("length_mm", 300);
        } else if (catLower.contains("kitsune") || catLower.contains("cpu") || catLower.contains("procesador")) {
            if (!specs.containsKey("socket")) specs.put("socket", "AM5");
            if (!specs.containsKey("tdp_w")) specs.put("tdp_w", 105);
        } else if (catLower.contains("motherboard") || catLower.contains("placa madre")) {
            if (!specs.containsKey("socket")) specs.put("socket", "AM5");
        } else if (catLower.contains("kappa") || catLower.contains("fuente") || catLower.contains("psu")) {
            if (!specs.containsKey("watts")) specs.put("watts", 750);
        } else if (catLower.contains("yurei") || catLower.contains("gabinete") || catLower.contains("case")) {
            if (!specs.containsKey("max_gpu_mm")) specs.put("max_gpu_mm", 380);
        }
    }
}
