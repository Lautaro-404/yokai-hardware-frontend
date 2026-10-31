package com.yokai.hardware.config;

import com.yokai.hardware.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class OpenApiIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /v3/api-docs debe responder 200 con esquema OpenAPI y seguridad BearerAuth")
    void testApiDocs() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.info.title").value("Yokai Hardware E-Commerce API"))
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth").exists())
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth.type").value("http"))
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth.scheme").value("bearer"))
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth.bearerFormat").value("JWT"))
                // Verificamos endpoints clave documentados
                .andExpect(jsonPath("$.paths['/api/auth/login']").exists())
                .andExpect(jsonPath("$.paths['/api/auth/register']").exists())
                .andExpect(jsonPath("$.paths['/api/productos']").exists())
                .andExpect(jsonPath("$.paths['/api/productos/{id}']").exists())
                .andExpect(jsonPath("$.paths['/api/categorias']").exists())
                .andExpect(jsonPath("$.paths['/api/marcas']").exists())
                .andExpect(jsonPath("$.paths['/api/carrito']").exists())
                .andExpect(jsonPath("$.paths['/api/carrito/items']").exists())
                .andExpect(jsonPath("$.paths['/api/pedidos']").exists())
                .andExpect(jsonPath("$.paths['/api/pedidos/mis-pedidos']").exists())
                .andExpect(jsonPath("$.paths['/api/admin/pedidos']").exists())
                .andExpect(jsonPath("$.paths['/api/admin/pedidos/{id}/estado']").exists())
                .andExpect(jsonPath("$.paths['/api/admin/productos/stock-bajo']").exists())
                .andExpect(jsonPath("$.paths['/api/health']").exists());
    }

    @Test
    @DisplayName("GET /swagger-ui.html debe redirigir a Swagger UI")
    void testSwaggerUiRedirect() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    @DisplayName("GET /swagger-ui/index.html debe responder 200 con el html de Swagger")
    void testSwaggerUiIndex() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("swagger-ui")));
    }
}
