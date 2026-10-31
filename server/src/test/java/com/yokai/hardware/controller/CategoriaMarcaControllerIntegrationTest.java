package com.yokai.hardware.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yokai.hardware.AbstractPostgresIntegrationTest;
import com.yokai.hardware.config.JwtService;
import com.yokai.hardware.dto.categoria.ActualizarCategoriaDto;
import com.yokai.hardware.dto.categoria.CrearCategoriaDto;
import com.yokai.hardware.dto.marca.ActualizarMarcaDto;
import com.yokai.hardware.dto.marca.CrearMarcaDto;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Transactional
class CategoriaMarcaControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String clienteToken;
    private Categoria categoriaBase;
    private Marca marcaBase;

    @BeforeEach
    void setUp() {
        Usuario admin = new Usuario("Admin Cat", "admin.cat@yokai.com", passwordEncoder.encode("Admin123!"), "ADMIN");
        admin = usuarioRepository.saveAndFlush(admin);
        adminToken = jwtService.generateToken(admin.getId(), admin.getEmail(), admin.getRol());

        Usuario cliente = new Usuario("Cliente Cat", "cliente.cat@yokai.com", passwordEncoder.encode("Cliente123!"), "CLIENTE");
        cliente = usuarioRepository.saveAndFlush(cliente);
        clienteToken = jwtService.generateToken(cliente.getId(), cliente.getEmail(), cliente.getRol());

        categoriaBase = categoriaRepository.findAll().get(0);
        marcaBase = marcaRepository.findAll().get(0);
    }

    @Test
    @DisplayName("GET /api/categorias y /api/categorias/{id} son públicos")
    void debePermitirGetPublicoCategorias() throws Exception {
        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/categorias/" + categoriaBase.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(categoriaBase.getId()))
                .andExpect(jsonPath("$.nombre").value(categoriaBase.getNombre()));
    }

    @Test
    @DisplayName("GET /api/marcas y /api/marcas/{id} son públicos")
    void debePermitirGetPublicoMarcas() throws Exception {
        mockMvc.perform(get("/api/marcas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/marcas/" + marcaBase.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(marcaBase.getId()))
                .andExpect(jsonPath("$.nombre").value(marcaBase.getNombre()));
    }

    @Test
    @DisplayName("POST /api/categorias sin token da 401, con CLIENTE da 403, con ADMIN crea (201)")
    void debeControlarSeguridadEnCrearCategoria() throws Exception {
        CrearCategoriaDto dto = new CrearCategoriaDto("TestCatUnica", "Sub", "霊", "memory", "gold", "Desc");
        String json = objectMapper.writeValueAsString(dto);

        // Sin token -> 401
        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());

        // Con CLIENTE -> 403
        mockMvc.perform(post("/api/categorias")
                        .header("Authorization", "Bearer " + clienteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());

        // Con ADMIN -> 201
        mockMvc.perform(post("/api/categorias")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("TestCatUnica"));
    }

    @Test
    @DisplayName("POST /api/marcas sin token da 401, con CLIENTE da 403, con ADMIN crea (201)")
    void debeControlarSeguridadEnCrearMarca() throws Exception {
        CrearMarcaDto dto = new CrearMarcaDto("TestMarcaUnica");
        String json = objectMapper.writeValueAsString(dto);

        // Sin token -> 401
        mockMvc.perform(post("/api/marcas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());

        // Con CLIENTE -> 403
        mockMvc.perform(post("/api/marcas")
                        .header("Authorization", "Bearer " + clienteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());

        // Con ADMIN -> 201
        mockMvc.perform(post("/api/marcas")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("TestMarcaUnica"));
    }

    @Test
    @DisplayName("PUT y DELETE en categorías y marcas solo permitidos para ADMIN")
    void debePermitirPutYDeleteSoloParaAdmin() throws Exception {
        ActualizarCategoriaDto catDto = new ActualizarCategoriaDto("Cat Modificada", "Sub", "霊", "memory", "gold", "Desc");
        mockMvc.perform(put("/api/categorias/" + categoriaBase.getId())
                        .header("Authorization", "Bearer " + clienteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catDto)))
                .andExpect(status().isForbidden());

        ActualizarMarcaDto marcaDto = new ActualizarMarcaDto("Marca Modificada");
        mockMvc.perform(put("/api/marcas/" + marcaBase.getId())
                        .header("Authorization", "Bearer " + clienteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(marcaDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE de categoría con productos asociados debe devolver 409 Conflict")
    void debeRechazarBorradoCategoriaConProductos() throws Exception {
        // categoriaBase tiene productos asociados según el seed
        mockMvc.perform(delete("/api/categorias/" + categoriaBase.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("productos asociados")));
    }

    @Test
    @DisplayName("DELETE de marca con productos asociados debe devolver 409 Conflict")
    void debeRechazarBorradoMarcaConProductos() throws Exception {
        // marcaBase (ASUS) tiene productos asociados según el seed
        mockMvc.perform(delete("/api/marcas/" + marcaBase.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("productos asociados")));
    }
}
