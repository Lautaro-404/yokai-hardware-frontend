package com.yokai.hardware.controller;

import com.yokai.hardware.config.OpenApiConfig;
import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.dto.marca.ActualizarMarcaDto;
import com.yokai.hardware.dto.marca.CrearMarcaDto;
import com.yokai.hardware.dto.marca.MarcaDto;
import com.yokai.hardware.service.MarcaService;
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
@RequestMapping("/api/marcas")
@Tag(name = "Marcas", description = "Gestión del catálogo de fabricantes y ensambladoras oficiales de hardware")
public class MarcaController {

    private final MarcaService marcaService;

    public MarcaController(MarcaService marcaService) {
        this.marcaService = marcaService;
    }

    @GetMapping
    @Operation(summary = "Listar marcas", description = "Devuelve el catálogo de fabricantes y ensambladoras oficiales.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado completo de marcas",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MarcaDto.class))))
    })
    public ResponseEntity<List<MarcaDto>> listarMarcas() {
        return ResponseEntity.ok(marcaService.listarTodas());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener marca por ID", description = "Devuelve los datos de una marca por su identificador único.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Marca encontrada",
                    content = @Content(schema = @Schema(implementation = MarcaDto.class))),
            @ApiResponse(responseCode = "404", description = "Marca no encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<MarcaDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(marcaService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Crear marca (ADMIN)", description = "Alta de un nuevo fabricante o ensambladora de hardware.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Marca creada exitosamente",
                    content = @Content(schema = @Schema(implementation = MarcaDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Ya existe una marca con ese nombre",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<MarcaDto> crearMarca(@Valid @RequestBody CrearMarcaDto dto) {
        MarcaDto creada = marcaService.crearMarca(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Actualizar marca (ADMIN)", description = "Modificación del nombre de un fabricante existente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Marca actualizada exitosamente",
                    content = @Content(schema = @Schema(implementation = MarcaDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Marca no encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Conflicto por nombre duplicado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<MarcaDto> actualizarMarca(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarMarcaDto dto
    ) {
        MarcaDto actualizada = marcaService.actualizarMarca(id, dto);
        return ResponseEntity.ok(actualizada);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
    @Operation(summary = "Eliminar marca (ADMIN)", description = "Baja de marca si no contiene productos asociados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Marca eliminada exitosamente"),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Marca no encontrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "No se puede eliminar la marca porque tiene productos asociados",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<Map<String, Boolean>> eliminarMarca(@PathVariable Long id) {
        marcaService.eliminarMarca(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
