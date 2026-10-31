package com.yokai.hardware;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.net.InetSocketAddress;
import java.net.Socket;

@SpringBootTest
public abstract class AbstractPostgresIntegrationTest {

    private static PostgreSQLContainer<?> postgres;

    private static boolean isLocalPostgresAvailable() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("localhost", 5432), 500);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (isLocalPostgresAvailable()) {
            registry.add("spring.datasource.url", () ->
                    System.getenv().getOrDefault("DB_URL", "jdbc:postgresql://localhost:5432/yokai_hardware_db"));
            registry.add("spring.datasource.username", () ->
                    System.getenv().getOrDefault("DB_USER", "postgres"));
            registry.add("spring.datasource.password", () ->
                    System.getenv().getOrDefault("DB_PASSWORD", "postgres123"));
        } else {
            if (postgres == null) {
                postgres = new PostgreSQLContainer<>("postgres:15-alpine")
                        .withDatabaseName("yokai_test_db")
                        .withUsername("test_user")
                        .withPassword("test_pass");
                postgres.start();
            }
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.fail-on-missing-locations", () -> "false");
        registry.add("spring.flyway.locations", () -> "filesystem:db/migration,filesystem:../db/migration,filesystem:db/seed,filesystem:../db/seed");
    }
}
