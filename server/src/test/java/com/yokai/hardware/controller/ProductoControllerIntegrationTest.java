package com.yokai.hardware.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yokai.hardware.AbstractPostgresIntegrationTest;
import com.yokai.hardware.config.JwtService;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.ProductoRepository;
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

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Transactional
class ProductoControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String adminToken;
    private String clienteToken;
    private Categoria categoria;
    private Marca marcaA;
    private Marca marcaB;
    private Producto barato;
    private Producto medio;
    private Producto agotado;

    @BeforeEach
    void setUp() {
        Usuario admin = usuarioRepository.saveAndFlush(
                new Usuario("Admin Prod", "admin.prod@yokai.com", passwordEncoder.encode("Admin123!"), "ADMIN"));
        adminToken = jwtService.generateToken(admin.getId(), admin.getEmail(), admin.getRol());
        Usuario cliente = usuarioRepository.saveAndFlush(
                new Usuario("Cliente Prod", "cliente.prod@yokai.com", passwordEncoder.encode("Cliente123!"), "CLIENTE"));
        clienteToken = jwtService.generateToken(cliente.getId(), cliente.getEmail(), cliente.getRol());

        categoria = categoriaRepository.findAll().get(0);
        marcaA = marcaRepository.saveAndFlush(new Marca("MarcaFiltroA"));
        marcaB = marcaRepository.saveAndFlush(new Marca("MarcaFiltroB"));

        barato = guardar("ZZ-F-1", "Zzfiltro Alfa", "100.00", 20, 3, marcaA);
        medio = guardar("ZZ-F-2", "Zzfiltro Beta", "500.00", 2, 3, marcaA);
        agotado = guardar("ZZ-F-3", "Zzfiltro Gamma", "300.00", 0, 3, marcaB);
    }

    private Producto guardar(String sku, String nombre, String precio, int stock, int minimo, Marca marca) {
        Producto p = new Producto();
        p.setSku(sku);
        p.setNombre(nombre);
        p.setDescripcion("Descripcion " + nombre);
        p.setPrecio(new BigDecimal(precio));
        p.setStock(stock);
        p.setStockMinimo(minimo);
        p.setCategoria(categoria);
        p.setMarca(marca);
        p.setEspecificaciones(new HashMap<>(Map.of("socket", "AM5", "tdp_w", 100, "length_mm", 300, "watts", 750, "max_gpu_mm", 380)));
        return productoRepository.saveAndFlush(p);
    }

    @Test
    @DisplayName("la busqueda por texto y la paginacion son combinables")
    void textoYPaginacion() throws Exception {
        mockMvc.perform(get("/api/productos").param("q", "zzfiltro").param("size", "2").param("page", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    @DisplayName("marca + rango de precio devuelven solo lo que cumple todo")
    void marcaYPrecio() throws Exception {
        mockMvc.perform(get("/api/productos").param("q", "zzfiltro").param("marca", "MarcaFiltroA")
                        .param("precioMin", "200").param("precioMax", "600"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].sku").value("ZZ-F-2"));
    }

    @Test
    @DisplayName("disponibilidad se combina con categoria y marca")
    void disponibilidadCombinada() throws Exception {
        mockMvc.perform(get("/api/productos").param("q", "zzfiltro").param("categoria", categoria.getNombre())
                        .param("disponibilidad", "SIN_STOCK"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].estadoStock").value("Sin stock"));

        mockMvc.perform(get("/api/productos").param("q", "zzfiltro").param("marca", "MarcaFiltroA")
                        .param("disponibilidad", "ULTIMAS_UNIDADES"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].estadoStock").value("Últimas unidades"));

        mockMvc.perform(get("/api/productos").param("q", "zzfiltro").param("disponibilidad", "DISPONIBLE"))
                .andExpect(jsonPath("$.totalElements").value(2));

        mockMvc.perform(get("/api/productos").param("q", "zzfiltro").param("marca", "MarcaFiltroB")
                        .param("disponibilidad", "EN_STOCK"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("una disponibilidad invalida o un rango invertido dan 400")
    void filtrosInvalidos() throws Exception {
        mockMvc.perform(get("/api/productos").param("disponibilidad", "AGOTADO"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/productos").param("precioMin", "900").param("precioMax", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/productos/{id} devuelve detalle con imagenes, descripcion y especificaciones")
    void detalle() throws Exception {
        mockMvc.perform(get("/api/productos/" + barato.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descripcion").value("Descripcion Zzfiltro Alfa"))
                .andExpect(jsonPath("$.imagenes").isArray())
                .andExpect(jsonPath("$.especificaciones.socket").value("AM5"))
                .andExpect(jsonPath("$.estadoStock").value("En stock"));

        mockMvc.perform(get("/api/productos/999999")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("ABM: sin token 401, CLIENTE 403, ADMIN crea 201; precio <= 0 o stock < 0 dan 400")
    void abmSoloAdminConValidacion() throws Exception {
        String valido = cuerpo("ZZ-NUEVO", "1500.00", 5);

        mockMvc.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON).content(valido))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/productos").header("Authorization", "Bearer " + clienteToken)
                        .contentType(MediaType.APPLICATION_JSON).content(valido))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/productos").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(valido))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estadoStock").value("En stock"));

        for (String invalido : new String[]{cuerpo("ZZ-P0", "0", 5), cuerpo("ZZ-PN", "-1", 5), cuerpo("ZZ-SN", "10.00", -1)}) {
            mockMvc.perform(post("/api/productos").header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON).content(invalido))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("PUT valida precio y stock, y DELETE es solo para ADMIN")
    void actualizarYEliminar() throws Exception {
        mockMvc.perform(put("/api/productos/" + barato.getId()).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"precio\":0}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/productos/" + barato.getId()).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stock\":-3}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/productos/" + barato.getId()).header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"stock\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoStock").value("Últimas unidades"));

        mockMvc.perform(delete("/api/productos/" + medio.getId()).header("Authorization", "Bearer " + clienteToken))
                .andExpect(status().isForbidden());
    }

    private String cuerpo(String sku, String precio, int stock) throws Exception {
        Map<String, Object> m = new HashMap<>();
        m.put("sku", sku);
        m.put("nombre", "Producto " + sku);
        m.put("descripcion", "Desc");
        m.put("precio", new BigDecimal(precio));
        m.put("stock", stock);
        m.put("categoria", categoria.getNombre());
        m.put("marca", "MarcaFiltroA");
        return objectMapper.writeValueAsString(m);
    }
}
