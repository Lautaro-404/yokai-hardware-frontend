package com.yokai.hardware.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yokai.hardware.AbstractPostgresIntegrationTest;
import com.yokai.hardware.config.JwtService;
import com.yokai.hardware.entity.CarritoItem;
import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Pedido;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.repository.CarritoItemRepository;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.PedidoRepository;
import com.yokai.hardware.repository.ProductoRepository;
import com.yokai.hardware.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class PedidoIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private MarcaRepository marcaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private CarritoItemRepository carritoItemRepository;
    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private Usuario cliente;
    private Usuario admin;
    private String tokenCliente;
    private String tokenAdmin;
    private Producto productoA;
    private Producto productoB;

    @BeforeEach
    void setUp() {
        limpiarDatosPrueba();

        cliente = usuarioRepository.saveAndFlush(
                new Usuario("Cliente Pedido", "pedido.cliente@yokai.com", passwordEncoder.encode("Cliente123!"), "CLIENTE"));
        admin = usuarioRepository.saveAndFlush(
                new Usuario("Admin Pedido", "pedido.admin@yokai.com", passwordEncoder.encode("Admin123!"), "ADMIN"));

        tokenCliente = jwtService.generateToken(cliente.getId(), cliente.getEmail(), cliente.getRol());
        tokenAdmin = jwtService.generateToken(admin.getId(), admin.getEmail(), admin.getRol());

        Categoria categoria = categoriaRepository.findAll().get(0);
        Marca marca = marcaRepository.findAll().get(0);
        Map<String, Object> specs = new HashMap<>(Map.of(
                "socket", "AM5", "tdp_w", 105, "length_mm", 300, "watts", 750, "max_gpu_mm", 380
        ));

        productoA = new Producto();
        productoA.setSku("ZZ-PED-A");
        productoA.setNombre("Procesador Kitsune A");
        productoA.setPrecio(new BigDecimal("100000.00"));
        productoA.setStock(5);
        productoA.setStockMinimo(1);
        productoA.setCategoria(categoria);
        productoA.setMarca(marca);
        productoA.setEspecificaciones(new HashMap<>(specs));
        productoA = productoRepository.saveAndFlush(productoA);

        productoB = new Producto();
        productoB.setSku("ZZ-PED-B");
        productoB.setNombre("Placa Oni B Escasa");
        productoB.setPrecio(new BigDecimal("250000.00"));
        productoB.setStock(1);
        productoB.setStockMinimo(1);
        productoB.setCategoria(categoria);
        productoB.setMarca(marca);
        productoB.setEspecificaciones(new HashMap<>(specs));
        productoB = productoRepository.saveAndFlush(productoB);
    }

    @AfterEach
    void tearDown() {
        limpiarDatosPrueba();
    }

    private void limpiarDatosPrueba() {
        usuarioRepository.findByEmailIgnoreCase("pedido.cliente@yokai.com").ifPresent(u -> {
            List<Pedido> pedidos = pedidoRepository.findHistorialCompletoByUsuarioId(u.getId());
            pedidoRepository.deleteAll(pedidos);
            pedidoRepository.flush();
            carritoItemRepository.deleteAll(carritoItemRepository.findByUsuarioId(u.getId()));
            carritoItemRepository.flush();
            usuarioRepository.delete(u);
            usuarioRepository.flush();
        });
        usuarioRepository.findByEmailIgnoreCase("pedido.admin@yokai.com").ifPresent(u -> {
            usuarioRepository.delete(u);
            usuarioRepository.flush();
        });
        productoRepository.findBySku("ZZ-PED-A").ifPresent(p -> {
            productoRepository.delete(p);
            productoRepository.flush();
        });
        productoRepository.findBySku("ZZ-PED-B").ifPresent(p -> {
            productoRepository.delete(p);
            productoRepository.flush();
        });
    }

    @Test
    @DisplayName("Compra exitosa: crea el pedido y detalles con precio congelado, descuenta stock, vacía el carrito y aparece en mis-pedidos")
    void compraExitosa() throws Exception {
        carritoItemRepository.saveAndFlush(new CarritoItem(cliente, productoA, 2));
        carritoItemRepository.saveAndFlush(new CarritoItem(cliente, productoB, 1));

        String body = objectMapper.writeValueAsString(Map.of(
                "direccionEnvio", "Av. San Martín 850, San Rafael",
                "metodoPago", "Transferencia Bancaria"
        ));

        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
                .andExpect(jsonPath("$.total").value(450000.00))
                .andExpect(jsonPath("$.detalles.length()").value(2))
                .andExpect(jsonPath("$.detalles[0].precioUnitario").value(100000.00))
                .andExpect(jsonPath("$.detalles[1].precioUnitario").value(250000.00));

        // Verificar que el stock fue descontado en la base de datos
        assertEquals(3, productoRepository.findById(productoA.getId()).orElseThrow().getStock());
        assertEquals(0, productoRepository.findById(productoB.getId()).orElseThrow().getStock());

        // Verificar que el carrito quedó vacío
        assertEquals(0, carritoItemRepository.findByUsuarioId(cliente.getId()).size());

        // Verificar que aparece en GET /api/pedidos/mis-pedidos
        mockMvc.perform(get("/api/pedidos/mis-pedidos")
                        .header("Authorization", "Bearer " + tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].total").value(450000.00))
                .andExpect(jsonPath("$[0].detalles.length()").value(2));
    }

    @Test
    @DisplayName("Stock insuficiente con rollback: si el segundo producto no alcanza, responde 409 indicando cuál y revierte el descuento del primero")
    void stockInsuficienteConRollbackTotal() throws Exception {
        // Producto A tiene stock 5 (pide 2 -> alcanzaría)
        // Producto B tiene stock 1 (pide 3 -> NO alcanza)
        carritoItemRepository.saveAndFlush(new CarritoItem(cliente, productoA, 2));
        carritoItemRepository.saveAndFlush(new CarritoItem(cliente, productoB, 3));

        String body = objectMapper.writeValueAsString(Map.of(
                "direccionEnvio", "Av. San Martín 850, San Rafael",
                "metodoPago", "Transferencia Bancaria"
        ));

        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Placa Oni B Escasa")));

        // Rollback verificado: el stock de Producto A sigue en 5 y el de Producto B en 1 (nunca negativo)
        assertEquals(5, productoRepository.findById(productoA.getId()).orElseThrow().getStock());
        assertEquals(1, productoRepository.findById(productoB.getId()).orElseThrow().getStock());

        // El carrito no se vació y no se creó ningún pedido
        assertEquals(2, carritoItemRepository.findByUsuarioId(cliente.getId()).size());
        assertEquals(0, pedidoRepository.findHistorialCompletoByUsuarioId(cliente.getId()).size());
    }

    @Test
    @DisplayName("Admin: GET /api/admin/pedidos y PATCH /api/admin/pedidos/{id}/estado validan rol y transiciones")
    void flujoAdminYTransicionesDeEstado() throws Exception {
        carritoItemRepository.saveAndFlush(new CarritoItem(cliente, productoA, 2));

        String checkoutBody = objectMapper.writeValueAsString(Map.of(
                "direccionEnvio", "Hipólito Yrigoyen 1420, San Rafael"
        ));

        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutBody))
                .andExpect(status().isCreated());

        Long pedidoId = pedidoRepository.findHistorialCompletoByUsuarioId(cliente.getId()).get(0).getIdPedido();

        // Cliente no puede acceder a rutas de admin (403)
        mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + tokenCliente))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/admin/pedidos/" + pedidoId + "/estado")
                        .header("Authorization", "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"PAGADO\"}"))
                .andExpect(status().isForbidden());

        // Admin lista todos los pedidos
        mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk());

        // Transición inválida: PENDIENTE_PAGO -> ENTREGADO (400)
        mockMvc.perform(patch("/api/admin/pedidos/" + pedidoId + "/estado")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"ENTREGADO\"}"))
                .andExpect(status().isBadRequest());

        // Transición válida: PENDIENTE_PAGO -> PAGADO (200)
        mockMvc.perform(patch("/api/admin/pedidos/" + pedidoId + "/estado")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"PAGADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("PAGADO"));

        // Cancelación: PAGADO -> CANCELADO restituye el stock a 5
        mockMvc.perform(patch("/api/admin/pedidos/" + pedidoId + "/estado")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"CANCELADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADO"));

        assertEquals(5, productoRepository.findById(productoA.getId()).orElseThrow().getStock());
    }
}
