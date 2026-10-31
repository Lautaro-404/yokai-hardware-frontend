package com.yokai.hardware.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Yokai Hardware E-Commerce API")
                        .description("""
                                API RESTful para la plataforma de comercio electrónico de componentes de PC y hardware con estética Yokai.
                                
                                ### Roles y Autenticación:
                                - **Autenticación:** JWT Stateless vía header `Authorization: Bearer <token>`.
                                - **CLIENTE:** Catálogo, carrito persistente, checkout atómico y consulta de mis pedidos.
                                - **ADMIN:** ABM de catálogo, categorías, marcas, consulta integral de pedidos y cambio de estados con control de ciclo de vida.
                                
                                ### Cuentas demo preconfiguradas:
                                - **Administrador:** `admin@yokaihardware.com.ar` / `Admin123!`
                                - **Cliente:** `cliente@yokaihardware.com.ar` / `Cliente123!`
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Grupo Print(\"Estoy Cansado Jefe\") - UTN San Rafael")
                                .email("contacto@yokaihardware.com.ar"))
                        .license(new License().name("Proyecto Integrador - Programación IV"))
                )
                .tags(List.of(
                        new Tag().name("Autenticación").description("Registro de clientes e inicio de sesión con generación de JWT"),
                        new Tag().name("Catálogo de Productos").description("Consulta pública facetada (búsqueda, marca, categoría, precio, stock) y ABM administrativo"),
                        new Tag().name("Categorías").description("Familias de componentes temáticas (Kitsune, Oni, Tengu, etc.)"),
                        new Tag().name("Marcas").description("Fabricantes y ensambladoras oficiales de hardware"),
                        new Tag().name("Carrito de Compras").description("Gestión del carrito persistente por usuario con cálculos en el servidor"),
                        new Tag().name("Pedidos y Checkout").description("Procesamiento transaccional atómico anti-overselling e historial del cliente"),
                        new Tag().name("Panel de Administración").description("Gestión de órdenes, transiciones de estado y alertas de stock bajo (Solo ADMIN)"),
                        new Tag().name("Health").description("Comprobación de salud de la API y conectividad con PostgreSQL")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .description("Ingresá tu token JWT obtenido de `/api/auth/login` o `/api/auth/register`")
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                        )
                );
    }
}
