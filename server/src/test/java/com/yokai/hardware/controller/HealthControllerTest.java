package com.yokai.hardware.controller;

import com.yokai.hardware.dto.health.HealthResponseDto;
import com.yokai.hardware.service.HealthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthControllerTest {

    @Mock
    private HealthService healthService;

    @InjectMocks
    private HealthController healthController;

    @Test
    @DisplayName("GET /api/health debe devolver 200 OK y estado UP")
    void debeDevolverEstadoSaludable() {
        HealthResponseDto expected = new HealthResponseDto(
                "UP",
                "yokai-hardware-api",
                "UP",
                Instant.now()
        );
        when(healthService.verificarEstado()).thenReturn(expected);

        ResponseEntity<HealthResponseDto> response = healthController.health();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().status());
        assertEquals("UP", response.getBody().database());
        assertEquals("yokai-hardware-api", response.getBody().service());
    }
}
