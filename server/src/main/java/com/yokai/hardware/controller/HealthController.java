package com.yokai.hardware.controller;

import com.yokai.hardware.dto.health.HealthResponseDto;
import com.yokai.hardware.service.HealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Verificación de estado del servicio y conexión a PostgreSQL")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    @Operation(summary = "Verificar estado de la API y conexión a la base de datos", description = "Endpoint público para monitoreo y comprobación de conectividad.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Servicio y base de datos operativos",
                    content = @Content(schema = @Schema(implementation = HealthResponseDto.class)))
    })
    public ResponseEntity<HealthResponseDto> health() {
        return ResponseEntity.ok(healthService.verificarEstado());
    }
}
