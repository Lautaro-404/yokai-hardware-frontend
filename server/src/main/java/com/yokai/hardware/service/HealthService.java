package com.yokai.hardware.service;

import com.yokai.hardware.dto.health.HealthResponseDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class HealthService {

    private final JdbcTemplate jdbcTemplate;

    public HealthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public HealthResponseDto verificarEstado() {
        Integer dbCheck = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        String dbStatus = (dbCheck != null && dbCheck == 1) ? "UP" : "DOWN";
        return new HealthResponseDto(
                "UP",
                "yokai-hardware-api",
                dbStatus,
                Instant.now()
        );
    }
}
