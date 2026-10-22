package com.yokai.hardware;

import com.yokai.hardware.entity.Categoria;
import com.yokai.hardware.entity.Marca;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.repository.CategoriaRepository;
import com.yokai.hardware.repository.MarcaRepository;
import com.yokai.hardware.repository.ProductoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class CheckoutConcurrencyTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private MarcaRepository marcaRepository;

    @Test
    @DisplayName("20 compras concurrentes sobre un producto con stock=2 deben permitir exactamente 2 ventas y dejar stock en 0")
    void testAntiOversellingConcurrente() throws InterruptedException {
        // Setup: Crear un producto con solo 2 unidades disponibles
        Categoria cat = categoriaRepository.findAll().get(0);
        Marca marca = marcaRepository.findAll().get(0);

        Producto gpuEscasa = new Producto();
        gpuEscasa.setSku("GPU-TEST-ESCASA-4090");
        gpuEscasa.setNombre("GPU Muy Limitada");
        gpuEscasa.setPrecio(new BigDecimal("1500000.00"));
        gpuEscasa.setStock(2); // Stock inicial: 2
        gpuEscasa.setStockMinimo(1);
        gpuEscasa.setCategoria(cat);
        gpuEscasa.setMarca(marca);
        gpuEscasa.setEspecificaciones(Map.of("tdp_w", 450, "length_mm": 350));
        gpuEscasa = productoRepository.saveAndFlush(gpuEscasa);

        final Long productoId = gpuEscasa.getId();
        final int numeroDeHilos = 20;

        ExecutorService executor = Executors.newFixedThreadPool(numeroDeHilos);
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(numeroDeHilos);

        AtomicInteger comprasExitosas = new AtomicInteger(0);
        AtomicInteger comprasRechazadas = new AtomicInteger(0);

        for (int i = 0; i < numeroDeHilos; i++) {
            executor.submit(() -> {
                try {
                    startSignal.await(); // Todos los hilos esperan la señal para disparar en simultáneo exacto
                    int filasAfectadas = productoRepository.descontarStock(productoId, 1);
                    if (filasAfectadas == 1) {
                        comprasExitosas.incrementAndGet();
                    } else {
                        comprasRechazadas.incrementAndGet();
                    }
                } catch (Exception e) {
                    comprasRechazadas.incrementAndGet();
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        // Disparo simultáneo de los 20 hilos
        startSignal.countDown();
        doneSignal.await();
        executor.shutdown();

        // Verificaciones matemáticas del inventario
        assertEquals(2, comprasExitosas.get(), "Exactamente 2 compras debieron tener éxito");
        assertEquals(18, comprasRechazadas.get(), "Exactamente 18 compras debieron ser rechazadas por falta de stock");

        // Stock final verificado en base de datos
        Producto productoFinal = productoRepository.findById(productoId).orElseThrow();
        assertEquals(0, productoFinal.getStock(), "El stock final debe ser exactamente 0, sin overselling");
    }
}
