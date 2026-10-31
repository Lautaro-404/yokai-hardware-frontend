package com.yokai.hardware.controller;

import com.yokai.hardware.config.OpenApiConfig;
import com.yokai.hardware.dto.categoria.ActualizarCategoriaDto;
import com.yokai.hardware.dto.categoria.CategoriaDto;
import com.yokai.hardware.dto.categoria.CrearCategoriaDto;
import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
@Tag(name = "Categorías", description = "Gestión de categorías temáticas de hardware")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    @Operation(summary = "Listar categorías", description = "Devuelve todas las categorías con sus metadatos visuales Yokai y conteo de modelos.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado completo de categorías",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = CategoriaDto.class))))
    })
    public ResponseEntity<List<CategoriaDto>> listarCategorias() {
        return ResponseEntity.ok(categoriaService.listarTodas());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener categoría por ID", description = "Devuelve el detalle de una categoría por su identificador único.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Categoría encontrada",
                    content = @Content(schema = @Schema(implementation = CategoriaDto.class))),
            @ApiResponse(responseCode = "404", description = "Categoría no encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CategoriaDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Crear categoría (ADMIN)", description = "Alta de una nueva categoría temática.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Categoría creada exitosamente",
                    content = @Content(schema = @Schema(implementation = CategoriaDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Ya existe una categoría con ese nombre",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CategoriaDto> crearCategoria(@Valid @RequestBody CrearCategoriaDto dto) {
        CategoriaDto creada = categoriaService.crearCategoria(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Actualizar categoría (ADMIN)", description = "Modificación de datos y estética visual de la categoría.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Categoría actualizada exitosamente",
                    content = @Content(schema = @Schema(implementation = CategoriaDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Categoría no encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Conflicto por nombre duplicado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CategoriaDto> actualizarCategoria(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarCategoriaDto dto
    ) {
        CategoriaDto actualizada = categoriaService.actualizarCategoria(id, dto);
        return ResponseEntity.ok(actualizada);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Eliminar categoría (ADMIN)", description = "Baja de categoría si no contiene productos asociados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Categoría eliminada exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Categoría no encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "No se puede eliminar la categoría porque tiene productos asociados",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<Map<String, Boolean>> eliminarCategoria(@PathVariable Long id) {
        categoriaService.eliminarCategoria(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
