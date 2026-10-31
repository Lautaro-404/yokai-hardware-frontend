package com.yokai.hardware.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yokai.hardware.AbstractPostgresIntegrationTest;
import com.yokai.hardware.config.JwtService;
import com.yokai.hardware.dto.auth.LoginRequestDto;
import com.yokai.hardware.dto.auth.RegistroRequestDto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Transactional
class AuthSecurityIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("POST /api/auth/register crea usuario con rol CLIENTE por defecto, BCrypt y nunca devuelve password")
    void debeRegistrarClienteConBcryptYSinExponerPassword() throws Exception {
        String email = "nuevo.cliente.b3@yokaihardware.com.ar";
        RegistroRequestDto request = new RegistroRequestDto(
                "Kenji Cliente",
                email,
                "ClaveSegura123!",
                "Av. Mitre 1200, San Rafael"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.email").value(email))
                .andExpect(jsonPath("$.usuario.rol").value("CLIENTE"))
                .andExpect(jsonPath("$.usuario.password").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertFalse(responseBody.contains("ClaveSegura123!"), "La respuesta nunca debe contener la contraseña en texto plano");

        Usuario guardado = usuarioRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertEquals("CLIENTE", guardado.getRol());
        assertNotEquals("ClaveSegura123!", guardado.getPassword());
        assertTrue(passwordEncoder.matches("ClaveSegura123!", guardado.getPassword()), "El hash guardado debe ser BCrypt válido");
    }

    @Test
    @DisplayName("POST /api/auth/login autentica un usuario registrado y devuelve token JWT válido")
    void debeLoguearUsuarioRegistrado() throws Exception {
        String email = "login.b3@yokaihardware.com.ar";
        RegistroRequestDto registro = new RegistroRequestDto(
                "Hana Login",
                email,
                "MiPassword123!",
                "San Lorenzo 450"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registro)))
                .andExpect(status().isCreated());

        LoginRequestDto login = new LoginRequestDto(email, "MiPassword123!");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.email").value(email))
                .andExpect(jsonPath("$.usuario.rol").value("CLIENTE"))
                .andExpect(jsonPath("$.usuario.password").doesNotExist())
                .andReturn();

        JsonNode json = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = json.get("token").asText();
        assertTrue(jwtService.isTokenValid(token, email));
        assertEquals("CLIENTE", jwtService.extractRole(token));
    }

    @Test
    @DisplayName("POST /api/auth/register valida DTOs y devuelve 400 cuando los campos son inválidos")
    void debeValidarDtoEnRegistro() throws Exception {
        RegistroRequestDto invalido = new RegistroRequestDto("", "correo-invalido", "123", "");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Ruta /api/admin/** devuelve 401 sin token, 403 con CLIENTE y 200 con ADMIN")
    void debeProtegerRutasAdminSegunRolYToken() throws Exception {
        // 1. Sin token -> 401 Unauthorized
        mockMvc.perform(get("/api/admin/pedidos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        // 2. Con token de CLIENTE -> 403 Forbidden
        Usuario cliente = new Usuario(
                "Cliente Test",
                "cliente.rol@yokaihardware.com.ar",
                passwordEncoder.encode("Cliente123!"),
                "CLIENTE"
        );
        cliente = usuarioRepository.saveAndFlush(cliente);
        String clienteToken = jwtService.generateToken(cliente.getId(), cliente.getEmail(), cliente.getRol());

        mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + clienteToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // 3. Con token de ADMIN -> 200 OK
        Usuario admin = new Usuario(
                "Admin Test",
                "admin.rol@yokaihardware.com.ar",
                passwordEncoder.encode("Admin123!"),
                "ADMIN"
        );
        admin = usuarioRepository.saveAndFlush(admin);
        String adminToken = jwtService.generateToken(admin.getId(), admin.getEmail(), admin.getRol());

        mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("El catálogo GET es público (200) pero el ABM POST /api/productos devuelve 403 para CLIENTE y 401 sin token")
    void debePermitirCatalogoPublicoYBloquearAbmParaCliente() throws Exception {
        // Catálogo público sin token -> 200 OK
        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isOk());

        // ABM sin token -> 401 Unauthorized
        mockMvc.perform(post("/api/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        // ABM con CLIENTE -> 403 Forbidden
        Usuario cliente = new Usuario(
                "Cliente ABM",
                "cliente.abm@yokaihardware.com.ar",
                passwordEncoder.encode("Cliente123!"),
                "CLIENTE"
        );
        cliente = usuarioRepository.saveAndFlush(cliente);
        String clienteToken = jwtService.generateToken(cliente.getId(), cliente.getEmail(), cliente.getRol());

        mockMvc.perform(post("/api/productos")
                        .header("Authorization", "Bearer " + clienteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }
}
