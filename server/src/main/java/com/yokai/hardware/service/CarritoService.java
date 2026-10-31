package com.yokai.hardware.service;

import com.yokai.hardware.dto.carrito.CarritoDto;
import com.yokai.hardware.dto.carrito.CarritoItemDto;
import com.yokai.hardware.dto.carrito.CarritoItemRequestDto;
import com.yokai.hardware.entity.CarritoItem;
import com.yokai.hardware.entity.Producto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.exception.StockConflictException;
import com.yokai.hardware.repository.CarritoItemRepository;
import com.yokai.hardware.repository.ProductoRepository;
import com.yokai.hardware.repository.UsuarioRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CarritoService {

    private final CarritoItemRepository carritoItemRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoService productoService;

    public CarritoService(
            CarritoItemRepository carritoItemRepository,
            ProductoRepository productoRepository,
            UsuarioRepository usuarioRepository,
            ProductoService productoService
    ) {
        this.carritoItemRepository = carritoItemRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.productoService = productoService;
    }

    @Transactional(readOnly = true)
    public CarritoDto obtenerCarrito(Long usuarioId) {
        List<CarritoItemDto> items = carritoItemRepository.findByUsuarioIdWithProducto(usuarioId)
                .stream()
                .map(this::mapToItemDto)
                .toList();
        BigDecimal total = items.stream()
                .map(CarritoItemDto::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int cantidadTotal = items.stream().mapToInt(CarritoItemDto::cantidad).sum();
        return new CarritoDto(items, cantidadTotal, total);
    }

    @Transactional
    public CarritoDto agregarItem(Long usuarioId, CarritoItemRequestDto dto) {
        validarCantidadPositiva(dto.cantidad());
        Producto producto = productoRepository.findById(dto.productoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + dto.productoId()));

        CarritoItem item = carritoItemRepository.findByUsuarioIdAndProductoId(usuarioId, producto.getId())
                .orElse(null);

        int cantidadActual = item != null ? item.getCantidad() : 0;
        validarStock(producto, cantidadActual + dto.cantidad());

        if (item == null) {
            Usuario usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));
            item = new CarritoItem(usuario, producto, dto.cantidad());
        } else {
            item.setCantidad(cantidadActual + dto.cantidad());
        }
        carritoItemRepository.save(item);
        return obtenerCarrito(usuarioId);
    }

    @Transactional
    public CarritoDto cambiarCantidad(Long usuarioId, Long itemId, int cantidad) {
        validarCantidadPositiva(cantidad);
        CarritoItem item = obtenerItemPropio(usuarioId, itemId);
        validarStock(item.getProducto(), cantidad);
        item.setCantidad(cantidad);
        carritoItemRepository.save(item);
        return obtenerCarrito(usuarioId);
    }

    @Transactional
    public CarritoDto eliminarItem(Long usuarioId, Long itemId) {
        CarritoItem item = obtenerItemPropio(usuarioId, itemId);
        carritoItemRepository.delete(item);
        carritoItemRepository.flush();
        return obtenerCarrito(usuarioId);
    }

    @Transactional
    public CarritoDto vaciarCarrito(Long usuarioId) {
        carritoItemRepository.deleteAllByUsuarioId(usuarioId);
        return obtenerCarrito(usuarioId);
    }

    private CarritoItem obtenerItemPropio(Long usuarioId, Long itemId) {
        CarritoItem item = carritoItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item de carrito no encontrado con ID: " + itemId));
        if (!item.getUsuario().getId().equals(usuarioId)) {
            throw new AccessDeniedException("El item no pertenece a tu carrito");
        }
        return item;
    }

    private void validarCantidadPositiva(Integer cantidad) {
        if (cantidad == null || cantidad <= 0) {
            throw new BusinessValidationException("La cantidad debe ser de al menos 1 unidad.");
        }
    }

    private void validarStock(Producto producto, int cantidadSolicitada) {
        int disponible = producto.getStock() != null ? producto.getStock() : 0;
        if (cantidadSolicitada > disponible) {
            throw new StockConflictException("Stock insuficiente para \"" + producto.getNombre()
                    + "\". Solicitado: " + cantidadSolicitada + ", disponible: " + disponible);
        }
    }

    private CarritoItemDto mapToItemDto(CarritoItem item) {
        BigDecimal subtotal = item.getProducto().getPrecio().multiply(BigDecimal.valueOf(item.getCantidad()));
        return new CarritoItemDto(
                item.getId(),
                productoService.mapToCardDto(item.getProducto()),
                item.getCantidad(),
                subtotal
        );
    }
}
