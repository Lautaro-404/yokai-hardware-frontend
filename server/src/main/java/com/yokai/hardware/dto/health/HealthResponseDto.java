package com.yokai.hardware.dto.health;

import java.time.Instant;

public record HealthResponseDto(
        String status,
        String service,
        String database,
        Instant timestamp
) {
}
