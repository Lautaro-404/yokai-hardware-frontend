package com.yokai.hardware.dto.categoria;

public record CategoriaDto(
    Long id,
    String slug,
    String nombre,
    String subtitulo,
    String kanji,
    String icono,
    String acento,
    String descripcion,
    long modelosCount,
    long stockModelos
) {}
