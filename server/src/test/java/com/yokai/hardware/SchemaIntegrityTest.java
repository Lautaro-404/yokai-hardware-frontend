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
    @Transactional
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
    @Transactional
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
    @DisplayName("El estado de stock no debe persistirse como columna")
    void noDebeExistirColumnaEstadoStock() {
        Integer columnas = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'producto' AND column_name = 'estado_stock'",
                Integer.class);
        assertEquals(0, columnas);
    }
}
