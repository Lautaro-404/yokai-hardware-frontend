package com.yokai.hardware.repository;

import com.yokai.hardware.entity.CarritoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarritoItemRepository extends JpaRepository<CarritoItem, Long> {

    @Query("SELECT c FROM CarritoItem c JOIN FETCH c.producto p LEFT JOIN FETCH p.categoria LEFT JOIN FETCH p.marca WHERE c.usuario.id = :usuarioId ORDER BY c.createdAt ASC")
    List<CarritoItem> findByUsuarioIdWithProducto(@Param("usuarioId") Long usuarioId);

    List<CarritoItem> findByUsuarioId(Long usuarioId);

    Optional<CarritoItem> findByUsuarioIdAndProductoId(Long usuarioId, Long productoId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM CarritoItem c WHERE c.usuario.id = :usuarioId")
    void deleteAllByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Modifying
    @Query("DELETE FROM CarritoItem c WHERE c.usuario.id = :usuarioId AND c.producto.id = :productoId")
    void deleteByUsuarioIdAndProductoId(@Param("usuarioId") Long usuarioId, @Param("productoId") Long productoId);
}
