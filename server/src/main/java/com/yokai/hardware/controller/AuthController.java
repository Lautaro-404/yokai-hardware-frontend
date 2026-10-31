package com.yokai.hardware.controller;

import com.yokai.hardware.dto.auth.AuthResponseDto;
import com.yokai.hardware.dto.auth.LoginRequestDto;
import com.yokai.hardware.dto.auth.RegistroRequestDto;
import com.yokai.hardware.dto.error.ErrorResponseDto;
import com.yokai.hardware.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Endpoints de registro e inicio de sesión con JWT stateless")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica credenciales de usuario y retorna token JWT con datos públicos de perfil.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa",
                    content = @Content(schema = @Schema(implementation = AuthResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "Credenciales inválidas",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/register", "/registro"})
    @Operation(summary = "Registrar nuevo cliente", description = "Crea una cuenta con rol CLIENTE por defecto, encripta la contraseña con BCrypt y retorna sesión JWT.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Registro exitoso",
                    content = @Content(schema = @Schema(implementation = AuthResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Validación fallida en campos de entrada",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class))),
            @ApiResponse(responseCode = "409", description = "El correo electrónico ya se encuentra registrado",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDto.class)))
    })
    public ResponseEntity<AuthResponseDto> registro(@Valid @RequestBody RegistroRequestDto request) {
        AuthResponseDto response = authService.registro(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
