package com.yokai.hardware.repository;

import com.yokai.hardware.entity.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Optional<Producto> findBySku(String sku);

    /**
     * DESCUENTO ATÓMICO ANTI-OVERSELLING
     * Decisión del Plan: UPDATE condicional a nivel de motor.
     * Retorna 1 si el stock fue descontado exitosamente, o 0 si no había stock suficiente
     * o el producto fue desactivado.
     */
    @Modifying
    @Query("""
        UPDATE Producto p
        SET p.stock = p.stock - :cantidad,
            p.updatedAt = CURRENT_TIMESTAMP
        WHERE p.id = :id
          AND p.activo = true
          AND p.stock >= :cantidad
    """)
    int descontarStock(@Param("id") Long id, @Param("cantidad") Integer cantidad);

    /**
     * RESTITUCIÓN DE STOCK (Por cancelación de pedidos pagados o fallas en el proceso)
     */
    @Modifying
    @Query("""
        UPDATE Producto p
        SET p.stock = p.stock + :cantidad,
            p.updatedAt = CURRENT_TIMESTAMP
        WHERE p.id = :id
    """)
    int restituirStock(@Param("id") Long id, @Param("cantidad") Integer cantidad);

    /**
     * Catálogo facetado con filtros opcionales
     */
    @Query("""
        SELECT p FROM Producto p
        WHERE (:categoriaId IS NULL OR p.categoria.id = :categoriaId)
          AND (:marcaId IS NULL OR p.marca.id = :marcaId)
          AND (:precioMin IS NULL OR p.precio >= :precioMin)
          AND (:precioMax IS NULL OR p.precio <= :precioMax)
    """)
    Page<Producto> buscarCatalogoFacetado(
        @Param("categoriaId") Long categoriaId,
        @Param("marcaId") Long marcaId,
        @Param("precioMin") BigDecimal precioMin,
        @Param("precioMax") BigDecimal precioMax,
        Pageable pageable
    );

    /**
     * Alerta de stock crítico para panel de administración
     */
    @Query("SELECT p FROM Producto p WHERE p.stock <= p.stockMinimo ORDER BY p.stock ASC")
    List<Producto> findProductosConStockBajo();

    /**
     * Motor de compatibilidad: Búsqueda nativa optimizada por socket en JSONB
     */
    @Query(value = """
        SELECT * FROM producto
        WHERE activo = true
          AND categoria_id = :categoriaId
          AND (especificaciones->>'socket') = :socket
    """, nativeQuery = true)
    List<Producto> findBySocketCompatibilidad(@Param("categoriaId") Long categoriaId, @Param("socket") String socket);
}
