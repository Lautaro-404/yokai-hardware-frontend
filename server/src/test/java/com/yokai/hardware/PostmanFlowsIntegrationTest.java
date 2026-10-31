package com.yokai.hardware;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class PostmanFlowsIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    @DisplayName("Ejecución secuencial completa de la colección de Postman (punta a punta)")
    void ejecutarColeccionPostmanEndToEnd() throws Exception {
        long timestamp = System.currentTimeMillis();

        // ---------------------------------------------------------------------
        // 01 - Autenticación
        // ---------------------------------------------------------------------

        // 01.1 - Registro nuevo cliente
        String regBody = objectMapper.writeValueAsString(Map.of(
                "nombre", "Cliente Postman Runner",
                "email", "postman.runner." + timestamp + "@yokai.com",
                "password", "Cliente123!",
                "direccion", "Av. San Martín 850, San Rafael"
        ));

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.usuario.rol").value("CLIENTE"))
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String clientToken = regJson.get("token").asText();
        assertNotNull(clientToken);

        // 01.2 - Login Cliente Demo
        String loginClienteBody = objectMapper.writeValueAsString(Map.of(
                "email", "cliente@yokaihardware.com.ar",
                "password", "Cliente123!"
        ));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginClienteBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.usuario.rol").value("CLIENTE"));

        // 01.3 - Login Administrador Demo
        String loginAdminBody = objectMapper.writeValueAsString(Map.of(
                "email", "admin@yokaihardware.com.ar",
                "password", "Admin123!"
        ));
        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginAdminBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.usuario.rol").value("ADMIN"))
                .andReturn();

        JsonNode adminJson = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString());
        String adminToken = adminJson.get("token").asText();
        assertNotNull(adminToken);

        // 01.4 - Login Fallido (401 Bad Credentials)
        String loginFailBody = objectMapper.writeValueAsString(Map.of(
                "email", "cliente@yokaihardware.com.ar",
                "password", "ClaveIncorrecta999"
        ));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginFailBody))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        // ---------------------------------------------------------------------
        // 02 - Catálogo y Filtros
        // ---------------------------------------------------------------------

        // 02.1 - Health Check
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"));

        // 02.2 - Categorías
        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 02.3 - Marcas
        mockMvc.perform(get("/api/marcas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 02.4 - Catálogo paginado
        MvcResult prodsResult = mockMvc.perform(get("/api/productos?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andReturn();

        JsonNode prodsJson = objectMapper.readTree(prodsResult.getResponse().getContentAsString());
        assertTrue(prodsJson.get("content").size() > 0);
        long productoId = prodsJson.get("content").get(0).get("id").asLong();

        // 02.5 - Catálogo facetado
        mockMvc.perform(get("/api/productos?categoria=Oni&disponibilidad=EN_STOCK&page=0&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 02.6 - Detalle de producto
        mockMvc.perform(get("/api/productos/" + productoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(productoId))
                .andExpect(jsonPath("$.estadoStock").exists());

        // ---------------------------------------------------------------------
        // 03 - Carrito de Compras (Cliente)
        // ---------------------------------------------------------------------

        // 03.1 - Vaciar Carrito previo
        mockMvc.perform(delete("/api/carrito")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        // 03.2 - Agregar Item al Carrito
        String itemBody = objectMapper.writeValueAsString(Map.of(
                "productoId", productoId,
                "cantidad", 1
        ));
        MvcResult addCartResult = mockMvc.perform(post("/api/carrito/items")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andReturn();

        JsonNode cartJson = objectMapper.readTree(addCartResult.getResponse().getContentAsString());
        long cartItemId = cartJson.get("items").get(0).get("id").asLong();

        // 03.3 - Cambiar Cantidad en Carrito
        String updateQtyBody = objectMapper.writeValueAsString(Map.of("cantidad", 1));
        mockMvc.perform(put("/api/carrito/items/" + cartItemId)
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateQtyBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidadTotal").value(1));

        // 03.4 - Obtener Carrito
        mockMvc.perform(get("/api/carrito")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        // ---------------------------------------------------------------------
        // 04 - Checkout y Pedidos (Cliente)
        // ---------------------------------------------------------------------

        // 04.1 - Confirmar Pedido
        String checkoutBody = objectMapper.writeValueAsString(Map.of(
                "direccionEnvio", "Av. San Martín 850, San Rafael, Mendoza (CP 5600)",
                "metodoPago", "Transferencia Bancaria"
        ));
        MvcResult pedidoResult = mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
                .andExpect(jsonPath("$.detalles.length()").value(1))
                .andReturn();

        JsonNode pedidoJson = objectMapper.readTree(pedidoResult.getResponse().getContentAsString());
        long pedidoId = pedidoJson.get("id").asLong();

        // 04.2 - Historial Mis Pedidos
        mockMvc.perform(get("/api/pedidos/mis-pedidos")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(pedidoId));

        // ---------------------------------------------------------------------
        // 05 - Panel de Administración (ADMIN)
        // ---------------------------------------------------------------------

        // 05.1 - Listar Pedidos como Admin
        mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 05.2 - Cambiar Estado a PAGADO
        String estadoPagadoBody = objectMapper.writeValueAsString(Map.of("estado", "PAGADO"));
        mockMvc.perform(patch("/api/admin/pedidos/" + pedidoId + "/estado")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(estadoPagadoBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("PAGADO"));

        // 05.3 - Cambiar Estado a EN_PREPARACION
        String estadoPrepBody = objectMapper.writeValueAsString(Map.of("estado", "EN_PREPARACION"));
        mockMvc.perform(patch("/api/admin/pedidos/" + pedidoId + "/estado")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(estadoPrepBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("EN_PREPARACION"));

        // 05.4 - Alerta de Stock Bajo
        mockMvc.perform(get("/api/admin/productos/stock-bajo")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // 05.5 - Crear Categoría (ADMIN)
        String catBody = objectMapper.writeValueAsString(Map.of(
                "nombre", "Perifericos_" + timestamp,
                "subtitulo", "Teclados y mouse",
                "descripcion", "Accesorios gamer",
                "kanji", "器",
                "icono", "keyboard",
                "acento", "violet"
        ));
        mockMvc.perform(post("/api/categorias")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(catBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Perifericos_" + timestamp));

        // 05.6 - Crear Producto (ADMIN)
        String prodBody = objectMapper.writeValueAsString(Map.of(
                "nombre", "Teclado Postman " + timestamp,
                "categoria", "Oni",
                "marca", "ASUS",
                "precio", 85000.00,
                "stock", 10,
                "stockMinimo", 2,
                "imagen", "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
                "subtituloCorto", "Switches ópticos",
                "descripcion", "Teclado RGB",
                "especificaciones", Map.of("switch", "Rojo", "formato", "75%")
        ));
        mockMvc.perform(post("/api/productos")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(prodBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").exists());

        // 05.7 - Seguridad: Rechazo de acceso a admin con rol CLIENTE (403)
        mockMvc.perform(get("/api/admin/pedidos")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}
