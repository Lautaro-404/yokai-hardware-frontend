package com.yokai.hardware.dto.auth;

public record AuthResponseDto(
    String token,
    UsuarioPublicoDto usuario
) {}
