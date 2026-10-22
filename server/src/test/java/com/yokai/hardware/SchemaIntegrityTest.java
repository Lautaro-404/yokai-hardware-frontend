package com.yokai.hardware;

import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.ProductoRepository;
import com.yokai.hardware.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class SchemaIntegrityTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Debe rechazar usuarios con el mismo email independientemente de mayúsculas/minúsculas")
    void debeRechazarEmailDuplicadoCaseInsensitive() {
        Usuario u1 = new Usuario("Test 1", "duplicado@yokai.com", "pass123", "CLIENTE");
        usuarioRepository.saveAndFlush(u1);

        Usuario u2 = new Usuario("Test 2", "DUPLICADO@YOKAI.COM", "pass456", "CLIENTE");
        assertThrows(DataIntegrityViolationException.class, () -> {
            usuarioRepository.saveAndFlush(u2);
        });
    }

    @Test
    @DisplayName("Debe rechazar producto con stock negativo violando CHECK (stock >= 0)")
    void debeRechazarStockNegativo() {
        Categoria cat = categoriaRepository.findAll().get(0);
        Marca marca = marcaRepository.findAll().get(0);

        Producto prod = new Producto();
        prod.setSku("TEST-STOCK-NEG");
        prod.setNombre("Test Negativo");
        prod.setPrecio(new BigDecimal("1000.00"));
        prod.setStock(-5); // Violación de CHECK
        prod.setStockMinimo(2);
        prod.setCategoria(cat);
        prod.setMarca(marca);
        prod.setEspecificaciones(Map.of("tdp_w", 100));

        assertThrows(Exception.class, () -> {
            productoRepository.saveAndFlush(prod);
        });
    }

    @Test
    @DisplayName("Debe calcular correctamente la columna generada estado_stock")
    @Transactional
    void debeCalcularEstadoStockGenerado() {
        Categoria cat = categoriaRepository.findAll().get(0);
        Marca marca = marcaRepository.findAll().get(0);

        // 1. Producto con stock normal > stockMinimo -> EN_STOCK
        Producto prod = new Producto();
        prod.setSku("TEST-ESTADO-STOCK");
        prod.setNombre("Test Estado");
        prod.setPrecio(new BigDecimal("5000.00"));
        prod.setStock(10);
        prod.setStockMinimo(3);
        prod.setCategoria(cat);
        prod.setMarca(marca);
        prod = productoRepository.saveAndFlush(prod);

        String estadoInicial = jdbcTemplate.queryForObject(
                "SELECT estado_stock FROM producto WHERE id = ?", String.class, prod.getId());
        assertEquals("EN_STOCK", estadoInicial);

        // 2. Modificar stock a últimas unidades (<= stockMinimo)
        jdbcTemplate.update("UPDATE producto SET stock = 2 WHERE id = ?", prod.getId());
        String estadoUltimas = jdbcTemplate.queryForObject(
                "SELECT estado_stock FROM producto WHERE id = ?", String.class, prod.getId());
        assertEquals("ULTIMAS_UNIDADES", estadoUltimas);

        // 3. Modificar stock a 0 -> SIN_STOCK
        jdbcTemplate.update("UPDATE producto SET stock = 0 WHERE id = ?", prod.getId());
        String estadoAgotado = jdbcTemplate.queryForObject(
                "SELECT estado_stock FROM producto WHERE id = ?", String.class, prod.getId());
        assertEquals("SIN_STOCK", estadoAgotado);
    }
}
