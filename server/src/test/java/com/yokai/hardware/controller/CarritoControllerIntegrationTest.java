package com.yokai.hardware.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yokai.hardware.AbstractPostgresIntegrationTest;
import com.yokai.hardware.config.JwtService;
import com.yokai.hardware.entity.CarritoItem;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.repository.CarritoItemRepository;
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
class CarritoControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private CarritoItemRepository carritoItemRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String tokenA;
    private String tokenB;
    private Usuario usuarioB;
    private Producto producto;

    @BeforeEach
    void setUp() {
        Usuario a = usuarioRepository.saveAndFlush(
                new Usuario("Cliente A", "cart.a@yokai.com", passwordEncoder.encode("Cliente123!"), "CLIENTE"));
        usuarioB = usuarioRepository.saveAndFlush(
                new Usuario("Cliente B", "cart.b@yokai.com", passwordEncoder.encode("Cliente123!"), "CLIENTE"));
        tokenA = jwtService.generateToken(a.getId(), a.getEmail(), a.getRol());
        tokenB = jwtService.generateToken(usuarioB.getId(), usuarioB.getEmail(), usuarioB.getRol());

        Categoria categoria = categoriaRepository.findAll().get(0);
        Marca marca = marcaRepository.findAll().get(0);
        producto = new Producto();
        producto.setSku("ZZ-CART-1");
        producto.setNombre("Producto carrito");
        producto.setPrecio(new BigDecimal("1000.00"));
        producto.setStock(4);
        producto.setStockMinimo(1);
        producto.setCategoria(categoria);
        producto.setMarca(marca);
        producto.setEspecificaciones(new HashMap<>(Map.of("socket", "AM5", "tdp_w", 100, "length_mm", 300, "watts", 750, "max_gpu_mm", 380)));
        producto = productoRepository.saveAndFlush(producto);
    }

    private String cuerpoItem(int cantidad) throws Exception {
        return objectMapper.writeValueAsString(Map.of("productoId", producto.getId(), "cantidad", cantidad));
    }

    private org.springframework.test.web.servlet.ResultActions agregar(String token, int cantidad) throws Exception {
        return mockMvc.perform(post("/api/carrito/items").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(cuerpoItem(cantidad)));
    }

    @Test
    @DisplayName("sin token el carrito responde 401")
    void sinToken() throws Exception {
        mockMvc.perform(get("/api/carrito")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("agregar crea el item y devuelve subtotal y total; agregar de nuevo suma")
    void agregarYSumar() throws Exception {
        agregar(tokenA, 1).andExpect(status().isCreated())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].subtotal").value(1000.00))
                .andExpect(jsonPath("$.total").value(1000.00));

        agregar(tokenA, 2).andExpect(status().isCreated())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].cantidad").value(3))
                .andExpect(jsonPath("$.total").value(3000.00));
    }

    @Test
    @DisplayName("superar el stock da 409 y cantidad menor a 1 da 400")
    void stockYValidacion() throws Exception {
        agregar(tokenA, 5).andExpect(status().isConflict());
        agregar(tokenA, 0).andExpect(status().isBadRequest());

        agregar(tokenA, 3).andExpect(status().isCreated());
        agregar(tokenA, 2).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PUT cambia la cantidad, DELETE quita el item y DELETE /api/carrito vacia")
    void cambiarQuitarYVaciar() throws Exception {
        agregar(tokenA, 1).andExpect(status().isCreated());
        Long itemId = carritoItemRepository.findByUsuarioIdAndProductoId(
                usuarioRepository.findByEmailIgnoreCase("cart.a@yokai.com").orElseThrow().getId(), producto.getId())
                .orElseThrow().getId();

        mockMvc.perform(put("/api/carrito/items/" + itemId).header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cantidad\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(4000.00));
        mockMvc.perform(put("/api/carrito/items/" + itemId).header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cantidad\":5}"))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/carrito/items/" + itemId).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        agregar(tokenA, 1).andExpect(status().isCreated());
        mockMvc.perform(delete("/api/carrito").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    @DisplayName("modificar o eliminar un item de otro usuario da 403 y no lo cambia")
    void carritoAjeno() throws Exception {
        CarritoItem ajeno = carritoItemRepository.saveAndFlush(new CarritoItem(usuarioB, producto, 1));

        mockMvc.perform(put("/api/carrito/items/" + ajeno.getId()).header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cantidad\":2}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/carrito/items/" + ajeno.getId()).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/carrito").header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(get("/api/carrito").header("Authorization", "Bearer " + tokenB))
                .andExpect(jsonPath("$.items[0].cantidad").value(1));
    }
}

