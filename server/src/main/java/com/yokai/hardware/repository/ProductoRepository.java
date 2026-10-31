package com.yokai.hardware.repository;

import com.yokai.hardware.entity.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Optional<Producto> findBySku(String sku);
    boolean existsBySku(String sku);

    long countByCategoriaId(Long categoriaId);
    long countByCategoriaNombreIgnoreCase(String categoriaNombre);

    long countByMarcaId(Long marcaId);
    long countByMarcaNombreIgnoreCase(String marcaNombre);

    @Query(value = "SELECT COUNT(*) FROM producto WHERE categoria_id = :categoriaId", nativeQuery = true)
    long countProductosByCategoriaId(@Param("categoriaId") Long categoriaId);

    @Query(value = "SELECT COUNT(*) FROM producto WHERE marca_id = :marcaId", nativeQuery = true)
    long countProductosByMarcaId(@Param("marcaId") Long marcaId);

    /**
     * DESCUENTO ATÓMICO ANTI-OVERSELLING
     * Decisión del Plan: UPDATE condicional a nivel de motor.
     * Retorna 1 si el stock fue descontado exitosamente, o 0 si no había stock suficiente
     * o el producto fue desactivado.
     */
    @Transactional
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
    @Transactional
    @Modifying
    @Query("""
        UPDATE Producto p
        SET p.stock = p.stock + :cantidad,
            p.updatedAt = CURRENT_TIMESTAMP
        WHERE p.id = :id
    """)
    int restituirStock(@Param("id") Long id, @Param("cantidad") Integer cantidad);

    /**
     * Catálogo facetado con filtros opcionales (búsqueda por texto, categoría, marca, rango de precio)
     */
    @Query("""
        SELECT p FROM Producto p
        WHERE (:categoriaNombre IS NULL OR :categoriaNombre = '' OR LOWER(p.categoria.nombre) = LOWER(:categoriaNombre))
          AND (:marcaNombre IS NULL OR :marcaNombre = '' OR LOWER(p.marca.nombre) = LOWER(:marcaNombre))
          AND (:precioMin IS NULL OR p.precio >= :precioMin)
          AND (:precioMax IS NULL OR p.precio <= :precioMax)
          AND (:q IS NULL OR :q = '' 
               OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.marca.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.categoria.nombre) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:disponibilidad IS NULL OR :disponibilidad = ''
               OR (:disponibilidad = 'SIN_STOCK' AND p.stock <= 0)
               OR (:disponibilidad = 'ULTIMAS_UNIDADES' AND p.stock > 0 AND p.stock <= p.stockMinimo)
               OR (:disponibilidad = 'EN_STOCK' AND p.stock > p.stockMinimo AND p.stock > 0)
               OR (:disponibilidad = 'DISPONIBLE' AND p.stock > 0))
    """)
    Page<Producto> buscarCatalogo(
        @Param("categoriaNombre") String categoriaNombre,
        @Param("marcaNombre") String marcaNombre,
        @Param("precioMin") BigDecimal precioMin,
        @Param("precioMax") BigDecimal precioMax,
        @Param("q") String q,
        @Param("disponibilidad") String disponibilidad,
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
