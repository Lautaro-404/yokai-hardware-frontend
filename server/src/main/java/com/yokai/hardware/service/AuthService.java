package com.yokai.hardware.service;

import com.yokai.hardware.config.JwtService;
import com.yokai.hardware.dto.auth.AuthResponseDto;
import com.yokai.hardware.dto.auth.LoginRequestDto;
import com.yokai.hardware.dto.auth.RegistroRequestDto;
import com.yokai.hardware.dto.auth.UsuarioPublicoDto;
import com.yokai.hardware.entity.Usuario;
import com.yokai.hardware.exception.BusinessValidationException;
import com.yokai.hardware.repository.UsuarioRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginRequestDto request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
            );
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Credenciales inválidas. Verificá tu correo y contraseña.");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));

        String token = jwtService.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol());

        UsuarioPublicoDto publico = new UsuarioPublicoDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getDireccion() != null ? usuario.getDireccion() : ""
        );

        return new AuthResponseDto(token, publico);
    }

    @Transactional
    public AuthResponseDto registro(RegistroRequestDto request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (usuarioRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BusinessValidationException("Ya existe una cuenta registrada con el correo: " + normalizedEmail);
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.nombre().trim());
        usuario.setEmail(normalizedEmail);
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuario.setRol("CLIENTE");
        usuario.setDireccion(request.direccion() != null ? request.direccion().trim() : "");
        usuario.setActivo(true);

        Usuario guardado = usuarioRepository.save(usuario);

        String token = jwtService.generateToken(guardado.getId(), guardado.getEmail(), guardado.getRol());

        UsuarioPublicoDto publico = new UsuarioPublicoDto(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getEmail(),
                guardado.getRol(),
                guardado.getDireccion()
        );

        return new AuthResponseDto(token, publico);
    }
}
