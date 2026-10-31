package com.yokai.hardware.controller;

import com.yokai.hardware.config.CustomUserDetails;
import com.yokai.hardware.config.OpenApiConfig;
import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.dto.pedido.*;
import com.yokai.hardware.service.PedidoService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
@Tag(name = "Pedidos y Checkout", description = "Procesamiento transaccional de compras, historial de clientes y despacho administrativo")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    @Operation(summary = "Realizar Checkout / Crear Pedido", description = "Transacción atómica anti-overselling: toma el carrito del usuario autenticado, valida stock, descuenta inventario, congela precios históricos y genera la orden.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pedido registrado y stock descontado exitosamente",
                    content = @Content(schema = @Schema(implementation = PedidoResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Carrito vacío o datos de envío incompletos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "Stock insuficiente para uno o más productos (rollback total)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<PedidoResponseDto> crearPedido(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CheckoutRequestDto dto
    ) {
        PedidoResponseDto creado = pedidoService.crearPedido(userDetails.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @GetMapping("/mis-pedidos")
    @Operation(summary = "Historial de compras del cliente", description = "Lista las órdenes del usuario autenticado ordenadas cronológicamente de la más reciente a la más antigua.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Historial de pedidos del usuario",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PedidoResponseDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<List<PedidoResponseDto>> misPedidos(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(pedidoService.obtenerMisPedidos(userDetails.getId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar todos los pedidos (ADMIN)", description = "Visualización integral de compras para control de stock, facturación y logística de despacho.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista completa de pedidos con datos de usuario",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PedidoAdminResponseDto.class)))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<List<PedidoAdminResponseDto>> todosLosPedidosAdmin() {
        return ResponseEntity.ok(pedidoService.obtenerTodosPedidosAdmin());
    }

    @RequestMapping(value = "/{id}/estado", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar estado de pedido (ADMIN)", description = "Avanza o cancela el ciclo de vida de la orden respetando la máquina de estados y restituyendo inventario si corresponde.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de pedido actualizado",
                    content = @Content(schema = @Schema(implementation = PedidoResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Transición de estado inválida o estado inexistente",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "No autenticado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "403", description = "Permisos insuficientes (requiere ADMIN)",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "Pedido no encontrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<PedidoResponseDto> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambioEstadoDto dto
    ) {
        PedidoResponseDto actualizado = pedidoService.actualizarEstadoPedido(id, dto.estado());
        return ResponseEntity.ok(actualizado);
    }
}
