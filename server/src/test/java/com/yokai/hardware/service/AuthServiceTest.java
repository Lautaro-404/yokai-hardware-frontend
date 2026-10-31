package com.yokai.hardware.service;

import com.yokai.hardware.config.JwtService;
import com.yokai.hardware.dto.auth.AuthResponseDto;
import com.yokai.hardware.dto.auth.LoginRequestDto;
import com.yokai.hardware.dto.auth.RegistroRequestDto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    private JwtService jwtService;
    private AuthService authService;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "yokaihardwaresecretsupersecurerandomkey2026utnsanrafaelverylongkeyforhs256!");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L);

        authService = new AuthService(usuarioRepository, passwordEncoder, jwtService, authenticationManager);

        usuario = new Usuario("Abril Dev", "abril@yokai.com", "hashBcrypt", "CLIENTE");
        usuario.setId(2L);
    }

    @Test
    @DisplayName("Debe loguear correctamente y retornar JWT")
    void debeLoguearCorrectamente() {
        when(usuarioRepository.findByEmailIgnoreCase("abril@yokai.com")).thenReturn(Optional.of(usuario));

        AuthResponseDto respuesta = authService.login(new LoginRequestDto("abril@yokai.com", "password123"));

        assertNotNull(respuesta);
        assertNotNull(respuesta.token());
        assertEquals("Abril Dev", respuesta.usuario().nombre());
        assertEquals("CLIENTE", respuesta.usuario().rol());
    }

    @Test
    @DisplayName("Debe registrar un nuevo usuario encriptando la clave")
    void debeRegistrarUsuario() {
        when(usuarioRepository.existsByEmailIgnoreCase("nuevo@yokai.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("encodedHash");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> {
            Usuario u = i.getArgument(0);
            u.setId(99L);
            return u;
        });

        RegistroRequestDto dto = new RegistroRequestDto("Nuevo Usuario", "nuevo@yokai.com", "Password123!", "Av. San Martin 100");
        AuthResponseDto respuesta = authService.registro(dto);

        assertNotNull(respuesta);
        assertNotNull(respuesta.token());
        assertEquals(99L, respuesta.usuario().id());
        verify(passwordEncoder).encode("Password123!");
    }

    @Test
    @DisplayName("Debe rechazar registro con email duplicado")
    void debeRechazarEmailDuplicado() {
        when(usuarioRepository.existsByEmailIgnoreCase("existente@yokai.com")).thenReturn(true);

        RegistroRequestDto dto = new RegistroRequestDto("Nombre", "existente@yokai.com", "Password123!", "");
        assertThrows(BusinessValidationException.class, () -> authService.registro(dto));
        verify(usuarioRepository, never()).save(any());
    }
}
