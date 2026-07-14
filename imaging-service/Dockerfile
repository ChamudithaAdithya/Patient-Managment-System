FROM eclipse-temurin:21-jre AS runner

WORKDIR /app

COPY target/imaging-service-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 4007

ENTRYPOINT [ "java", "-jar", "app.jar" ]
