package com.yokai.hardware.controller;

import com.yokai.hardware.config.OpenApiConfig;
import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.dto.producto.ActualizarProductoDto;
import com.yokai.hardware.dto.producto.CrearProductoDto;
import com.yokai.hardware.dto.producto.PageResponseDto;
import com.yokai.hardware.dto.producto.ProductoCardDto;
import com.yokai.hardware.dto.producto.ProductoDetalleDto;
import com.yokai.hardware.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@Tag(name = "Catálogo de Productos", description = "Endpoints de consulta pública y gestión ABM de componentes de hardware")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    @Operation(summary = "Listar catálogo con filtros facetados", description = "Recupera productos activos con filtros opcionales por categoría, marca, precio, búsqueda difusa y ordenamiento.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Página de productos obtenida exitosamente")
    })
    public ResponseEntity<PageResponseDto<ProductoCardDto>> listarProductos(
            @Parameter(description = "Nombre de la categoría tematica (ej. Oni, Kitsune)") @RequestParam(required = false) String categoria,
            @Parameter(description = "Nombre de la marca (ej. ASUS, AMD)") @RequestParam(required = false) String marca,
            @Parameter(description = "Precio mínimo en ARS") @RequestParam(required = false) BigDecimal precioMin,
            @Parameter(description = "Precio máximo en ARS") @RequestParam(required = false) BigDecimal precioMax,
            @Parameter(description = "Término de búsqueda de texto libre") @RequestParam(required = false) String q,
            @Parameter(description = "Filtro de stock: EN_STOCK, ULTIMAS_UNIDADES, SIN_STOCK, DISPONIBLE") @RequestParam(required = false) String disponibilidad,
            @Parameter(description = "Criterio de orden: precio_asc, precio_desc, nombre_asc, mas_recientes") @RequestParam(required = false) String orden,
            @Parameter(description = "Número de página (inicia en 0)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "8") int size
    ) {
        PageResponseDto<ProductoCardDto> resultado = productoService.buscarProductos(
                categoria, marca, precioMin, precioMax, q, disponibilidad, orden, page, size
        );
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de producto por ID", description = "Devuelve la ficha completa del producto con sus especificaciones técnicas semiestructuradas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto encontrado",
                    content = @Content(schema = @Schema(implementation = ProductoDetalleDto.class))),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<ProductoDetalleDto> obtenerPorId(@PathVariable Long id) {
        ProductoDetalleDto producto = productoService.obtenerPorId(id);
        return ResponseEntity.ok(producto);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Crear nuevo producto (ADMIN)", description = "Alta de componente en el catálogo con validación de categorías y autogeneración de SKU.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Producto creado exitosamente",
                    content = @Content(schema = @Schema(implementation = ProductoCardDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos o precio menor o igual a 0",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Violación de unicidad de SKU",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<ProductoCardDto> crearProducto(@Valid @RequestBody CrearProductoDto dto) {
        ProductoCardDto creado = productoService.crearProducto(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Actualizar producto (ADMIN)", description = "Modificación de datos del producto o actualización directa de stock disponible.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto actualizado exitosamente",
                    content = @Content(schema = @Schema(implementation = ProductoCardDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<ProductoCardDto> actualizarProducto(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarProductoDto dto
    ) {
        ProductoCardDto actualizado = productoService.actualizarProducto(id, dto);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Eliminar producto (ADMIN)", description = "Baja lógica (soft delete) del producto preservando la integridad histórica contable.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto desactivado exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<Map<String, Boolean>> eliminarProducto(@PathVariable Long id) {
        productoService.eliminarProducto(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
