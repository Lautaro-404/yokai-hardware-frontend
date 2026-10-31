package com.yokai.hardware.dto.error;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "Estructura uniforme de respuesta de error de la API")
public record ErrorResponseDto(
    @Schema(description = "Código de estado HTTP", example = "400")
    int status,

    @Schema(description = "Nombre o categoría del error HTTP", example = "Bad Request")
    String error,

    @Schema(description = "Mensaje explicativo del error en español neutro", example = "Uno o más campos no cumplen con las validaciones requeridas.")
    String message,

    @Schema(description = "Detalle granular de validaciones de campo o causa del conflicto", example = "[\"email: Debe ser un correo electrónico válido\", \"password: La contraseña debe tener al menos 6 caracteres\"]")
    List<String> details,

    @Schema(description = "Ruta URL donde ocurrió el error", example = "/api/auth/login")
    String path,

    @Schema(description = "Marca de tiempo del error", example = "2026-10-31T00:45:00")
    LocalDateTime timestamp
) {
    public ErrorResponseDto(int status, String error, String message, String path) {
        this(status, error, message, List.of(), path, LocalDateTime.now());
    }

    public ErrorResponseDto(int status, String error, String message, List<String> details, String path) {
        this(status, error, message, details != null ? details : List.of(), path, LocalDateTime.now());
    }
}
