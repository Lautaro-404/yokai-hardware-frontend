package com.yokai.hardware.controller;

import com.yokai.hardware.config.CustomUserDetails;
import com.yokai.hardware.config.OpenApiConfig;
import com.yokai.hardware.dto.carrito.CambiarCantidadDto;
import com.yokai.hardware.dto.carrito.CarritoDto;
import com.yokai.hardware.dto.carrito.CarritoItemRequestDto;
import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.service.CarritoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carrito")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
@Tag(name = "Carrito de Compras", description = "Carrito del usuario autenticado, con subtotales y total calculados en el servidor")
public class CarritoController {

    private final CarritoService carritoService;

    public CarritoController(CarritoService carritoService) {
        this.carritoService = carritoService;
    }

    @GetMapping
    @Operation(summary = "Obtener carrito", description = "Devuelve los items del usuario con subtotales y total.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Carrito recuperado exitosamente",
                    content = @Content(schema = @Schema(implementation = CarritoDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CarritoDto> obtenerCarrito(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(carritoService.obtenerCarrito(userDetails.getId()));
    }

    @PostMapping("/items")
    @Operation(summary = "Agregar producto", description = "Agrega un producto; si ya estaba en el carrito suma la cantidad. Responde 409 si supera el stock.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Item agregado o actualizado en el carrito",
                    content = @Content(schema = @Schema(implementation = CarritoDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Stock insuficiente para la cantidad solicitada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CarritoDto> agregarItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CarritoItemRequestDto dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(carritoService.agregarItem(userDetails.getId(), dto));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Cambiar cantidad", description = "Fija la cantidad exacta de un item propio. 403 si el item es de otro usuario.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cantidad modificada",
                    content = @Content(schema = @Schema(implementation = CarritoDto.class))),
            @ApiResponse(responseCode = "400", description = "Cantidad menor o igual a 0",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "El item no pertenece al usuario autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Item de carrito no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Stock insuficiente",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CarritoDto> cambiarCantidad(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CambiarCantidadDto dto
    ) {
        return ResponseEntity.ok(carritoService.cambiarCantidad(userDetails.getId(), id, dto.cantidad()));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Quitar item", description = "Quita un item propio. 403 si el item es de otro usuario.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item eliminado del carrito",
                    content = @Content(schema = @Schema(implementation = CarritoDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "El item no pertenece al usuario autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Item de carrito no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CarritoDto> eliminarItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(carritoService.eliminarItem(userDetails.getId(), id));
    }

    @DeleteMapping
    @Operation(summary = "Vaciar carrito", description = "Elimina todos los items del usuario autenticado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Carrito vaciado",
                    content = @Content(schema = @Schema(implementation = CarritoDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<CarritoDto> vaciarCarrito(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(carritoService.vaciarCarrito(userDetails.getId()));
    }
}
