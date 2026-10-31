package com.yokai.hardware.repository;

import com.yokai.hardware.entity.EstadoPedido;
import com.yokai.hardware.entity.Pedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.detalles d LEFT JOIN FETCH d.producto WHERE p.usuario.id = :usuarioId ORDER BY p.fecha DESC")
    List<Pedido> findHistorialCompletoByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.detalles d LEFT JOIN FETCH d.producto LEFT JOIN FETCH p.usuario ORDER BY p.fecha DESC")
    List<Pedido> findAllWithDetallesAndUsuario();

    Page<Pedido> findByEstadoOrderByFechaDesc(EstadoPedido estado, Pageable pageable);
}
