package com.yokai.hardware.controller;

import com.yokai.hardware.config.OpenApiConfig;
import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.dto.pedido.CambioEstadoDto;
import com.yokai.hardware.dto.pedido.PedidoAdminResponseDto;
import com.yokai.hardware.dto.pedido.PedidoResponseDto;
import com.yokai.hardware.dto.producto.ProductoCardDto;
import com.yokai.hardware.service.PedidoService;
import com.yokai.hardware.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
@Tag(name = "Panel de Administración", description = "Endpoints exclusivos para usuarios con rol ADMIN")
public class AdminController {

    private final PedidoService pedidoService;
    private final ProductoService productoService;

    public AdminController(PedidoService pedidoService, ProductoService productoService) {
        this.pedidoService = pedidoService;
        this.productoService = productoService;
    }

    @GetMapping("/pedidos")
    @Operation(summary = "Listar todos los pedidos (ADMIN)", description = "Devuelve todos los pedidos del sistema para gestión administrativa.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado completo de pedidos con datos del cliente",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PedidoAdminResponseDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<List<PedidoAdminResponseDto>> listarPedidos() {
        return ResponseEntity.ok(pedidoService.obtenerTodosPedidosAdmin());
    }

    @RequestMapping(value = "/pedidos/{id}/estado", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Actualizar estado de pedido (ADMIN)", description = "Cambia el estado de un pedido validando las transiciones permitidas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de orden actualizado",
                    content = @Content(schema = @Schema(implementation = PedidoResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Transición inválida o estado no reconocido",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Pedido no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<PedidoResponseDto> actualizarEstadoPedido(
            @PathVariable Long id,
            @Valid @RequestBody CambioEstadoDto dto
    ) {
        return ResponseEntity.ok(pedidoService.actualizarEstadoPedido(id, dto.estado()));
    }

    @GetMapping("/productos/stock-bajo")
    @Operation(summary = "Alertas de stock mínimo (ADMIN)", description = "Lista los productos cuyo stock actual es menor o igual a su stock mínimo configurado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de productos con stock en alerta",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ProductoCardDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<List<ProductoCardDto>> listarProductosStockBajo() {
        return ResponseEntity.ok(productoService.obtenerProductosConStockBajo());
    }
}
