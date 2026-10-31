package com.yokai.hardware.dto.producto;

import org.springframework.data.domain.Page;
import java.util.List;

public record PageResponseDto<T>(
    List<T> content,
    int totalPages,
    long totalElements,
    int page,
    int size
) {
    public static <T> PageResponseDto<T> fromPage(Page<T> page) {
        return new PageResponseDto<>(
            page.getContent(),
            page.getTotalPages(),
            page.getTotalElements(),
            page.getNumber(),
            page.getSize()
        );
    }
}
