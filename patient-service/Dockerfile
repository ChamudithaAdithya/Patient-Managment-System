# --- Stage 1: Build the application using Maven and JDK 21 ---
FROM maven:3.9.9-eclipse-temurin-21 AS builder

# Set working directory inside the container for the build stage
WORKDIR /app

# Copy the Maven build file to the working directory
COPY pom.xml .

# Pre-download all dependencies to improve caching and build speed
RUN mvn dependency:go-offline

# Copy the entire source code into the container
COPY src ./src

# Compile and package the Spring Boot application (produces a JAR file)
RUN mvn clean package -DskipTests

# --- Stage 2: Create a lightweight runtime container ---
FROM eclipse-temurin:21-jre AS runner

# Set working directory for the runtime stage
WORKDIR /app

# Copy the JAR file from the builder stage into the runtime container
COPY --from=builder ./app/target/patient-service-0.0.1-SNAPSHOT.jar ./app.jar

# Inform Docker that the container will listen on port 4000
EXPOSE 4000

# Set the command to run the Spring Boot application
ENTRYPOINT [ "java", "-jar", "app.jar" ]
