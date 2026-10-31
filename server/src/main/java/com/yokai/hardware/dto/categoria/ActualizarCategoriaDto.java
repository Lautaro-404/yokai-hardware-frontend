package com.yokai.hardware.dto.categoria;

import jakarta.validation.constraints.Size;

public record ActualizarCategoriaDto(
    @Size(max = 50, message = "El nombre no puede superar los 50 caracteres")
    String nombre,

    @Size(max = 100, message = "El subtítulo no puede superar los 100 caracteres")
    String subtitulo,

    @Size(max = 10, message = "El kanji no puede superar los 10 caracteres")
    String kanji,

    @Size(max = 50, message = "El identificador de icono no puede superar los 50 caracteres")
    String icono,

    @Size(max = 20, message = "El acento no puede superar los 20 caracteres")
    String acento,

    String descripcion
) {}
