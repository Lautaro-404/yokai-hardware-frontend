# ==============================================================================
# Multi-stage Dockerfile para Yokai Hardware Backend (Spring Boot 3 + Java 17)
# ==============================================================================

# --- Etapa 1: Compilación con Maven ---
FROM maven:3.9.8-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copiar descriptor de dependencias
COPY server/pom.xml .

# Pre-descargar dependencias para aprovechar el caché de capas de Docker
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY server/src ./src

# Compilar paquete JAR (omitiendo tests durante la creación de la imagen)
RUN mvn clean package -DskipTests

# --- Etapa 2: Entorno de Ejecución JRE liviano ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiar migraciones SQL y datos semilla para Flyway
COPY db ./db

# Copiar artefacto compilado desde la etapa de build
COPY --from=build /app/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
