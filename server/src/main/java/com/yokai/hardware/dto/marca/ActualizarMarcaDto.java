package com.yokai.hardware.dto.marca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActualizarMarcaDto(
    @NotBlank(message = "El nombre de la marca es requerido")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    String nombre
) {}
