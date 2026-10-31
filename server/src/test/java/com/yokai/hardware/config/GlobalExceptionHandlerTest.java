package com.yokai.hardware.config;

import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.exception.ConflictException;
import com.yokai.hardware.exception.ResourceNotFoundException;
import com.yokai.hardware.exception.StockConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.http.HttpMethod;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/test-endpoint");
    }

    @Test
    @DisplayName("MethodArgumentNotValidException debe responder 400 con detalles por campo")
    void testValidationErrors() throws NoSuchMethodException {
        Object target = new Object();
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(target, "target");
        bindingResult.addError(new FieldError("target", "email", "Debe ser un email válido"));
        bindingResult.addError(new FieldError("target", "precio", "Debe ser mayor a 0"));

        Method method = this.getClass().getDeclaredMethod("setUp");
        MethodParameter parameter = new MethodParameter(method, -1);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ErrorResponseDto> response = handler.handleValidationErrors(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertEquals("Bad Request", response.getBody().error());
        assertEquals("/api/test-endpoint", response.getBody().path());
        assertEquals(2, response.getBody().details().size());
        assertTrue(response.getBody().details().get(0).contains("email"));
        assertTrue(response.getBody().details().get(1).contains("precio"));
    }

    @Test
    @DisplayName("BusinessValidationException debe responder 400 con mensaje de negocio")
    void testBusinessValidation() {
        BusinessValidationException ex = new BusinessValidationException("El carrito se encuentra vacío.");

        ResponseEntity<ErrorResponseDto> response = handler.handleBusinessValidation(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertEquals("El carrito se encuentra vacío.", response.getBody().message());
    }

    @Test
    @DisplayName("HttpMessageNotReadableException debe responder 400")
    void testMessageNotReadable() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException(
                "JSON malformado", new MockHttpInputMessage(new byte[0]));

        ResponseEntity<ErrorResponseDto> response = handler.handleMessageNotReadable(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertTrue(response.getBody().message().contains("formato JSON válido"));
    }

    @Test
    @DisplayName("MethodArgumentTypeMismatchException debe responder 400")
    void testTypeMismatch() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "invalido", Long.class, "id", null, new IllegalArgumentException());

        ResponseEntity<ErrorResponseDto> response = handler.handleTypeMismatch(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertTrue(response.getBody().message().contains("'id'"));
    }

    @Test
    @DisplayName("MissingServletRequestParameterException debe responder 400")
    void testMissingParameter() {
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("categoria", "String");

        ResponseEntity<ErrorResponseDto> response = handler.handleMissingParameter(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertTrue(response.getBody().message().contains("categoria"));
    }

    @Test
    @DisplayName("AuthenticationException debe responder 401")
    void testAuthentication() {
        BadCredentialsException ex = new BadCredentialsException("Password errónea");

        ResponseEntity<ErrorResponseDto> response = handler.handleAuthentication(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().status());
        assertEquals("Unauthorized", response.getBody().error());
        assertTrue(response.getBody().message().contains("Credenciales inválidas"));
    }

    @Test
    @DisplayName("AccessDeniedException debe responder 403")
    void testAccessDenied() {
        AccessDeniedException ex = new AccessDeniedException("Acceso restringido a ADMIN");

        ResponseEntity<ErrorResponseDto> response = handler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().status());
        assertEquals("Forbidden", response.getBody().error());
        assertTrue(response.getBody().message().contains("permisos suficientes"));
    }

    @Test
    @DisplayName("ResourceNotFoundException debe responder 404")
    void testResourceNotFound() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Producto no encontrado con ID: 999");

        ResponseEntity<ErrorResponseDto> response = handler.handleNotFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().status());
        assertEquals("Not Found", response.getBody().error());
        assertEquals("Producto no encontrado con ID: 999", response.getBody().message());
    }

    @Test
    @DisplayName("NoResourceFoundException debe responder 404")
    void testNoResourceFound() {
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/ruta-inexistente");

        ResponseEntity<ErrorResponseDto> response = handler.handleNoResourceFound(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().status());
        assertTrue(response.getBody().message().contains("/ruta-inexistente"));
    }

    @Test
    @DisplayName("StockConflictException debe responder 409 con detalle de stock")
    void testStockConflict() {
        StockConflictException ex = new StockConflictException(
                "Stock insuficiente para \"GeForce RTX 4090\". Solicitado: 2, disponible: 1");

        ResponseEntity<ErrorResponseDto> response = handler.handleStockConflict(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().status());
        assertEquals("Conflict", response.getBody().error());
        assertTrue(response.getBody().message().contains("Stock insuficiente"));
    }

    @Test
    @DisplayName("ConflictException genérico debe responder 409")
    void testConflictException() {
        ConflictException ex = new ConflictException("Conflicto con la entidad actual");

        ResponseEntity<ErrorResponseDto> response = handler.handleConflict(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().status());
        assertEquals("Conflicto con la entidad actual", response.getBody().message());
    }

    @Test
    @DisplayName("DataIntegrityViolationException con duplicate key debe responder 409")
    void testDataIntegrityDuplicateKey() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "ERROR: duplicate key value violates unique constraint \"uq_usuario_email\"");

        ResponseEntity<ErrorResponseDto> response = handler.handleDataIntegrity(ex, request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(409, response.getBody().status());
        assertTrue(response.getBody().message().contains("Ya existe un registro con esos datos únicos"));
    }

    @Test
    @DisplayName("Exception general debe responder 500")
    void testGeneralException() {
        RuntimeException ex = new RuntimeException("Falla inesperada de I/O");

        ResponseEntity<ErrorResponseDto> response = handler.handleGeneralException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().status());
        assertEquals("Internal Server Error", response.getBody().error());
        assertTrue(response.getBody().message().contains("Ocurrió un error inesperado"));
    }
}
