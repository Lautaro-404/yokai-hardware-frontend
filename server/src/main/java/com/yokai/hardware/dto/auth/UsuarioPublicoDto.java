package com.yokai.hardware.dto.auth;

public record UsuarioPublicoDto(
    Long id,
    String nombre,
    String email,
    String rol,
    String direccion
) {}
