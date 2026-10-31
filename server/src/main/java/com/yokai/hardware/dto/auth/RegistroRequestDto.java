package com.yokai.hardware.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroRequestDto(
    @NotBlank(message = "El nombre completo es requerido")
    @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
    String nombre,

    @NotBlank(message = "El email es requerido")
    @Email(message = "El formato de email no es válido")
    @Size(max = 120, message = "El email no puede exceder 120 caracteres")
    String email,

    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 6, max = 100, message = "La contraseña debe tener entre 6 y 100 caracteres")
    String password,

    String direccion
) {}
