package com.pm.appointment_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/doctors/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "PATIENT", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/doctors").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/doctors/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/doctors/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/appointments/doctor/*/available").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "PATIENT", "STAFF")
                        .requestMatchers(HttpMethod.GET, "/appointments/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "STAFF")
                        .requestMatchers(HttpMethod.POST, "/appointments").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "PATIENT", "STAFF")
                        .requestMatchers(HttpMethod.PUT, "/appointments/**/cancel").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "PATIENT", "STAFF")
                        .requestMatchers(HttpMethod.PUT, "/appointments/**/complete").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR")
                        .requestMatchers(HttpMethod.POST, "/consultations").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/consultations/appointment/*").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "STAFF")
                        .requestMatchers(HttpMethod.GET, "/consultations/patient/*").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR", "PATIENT", "STAFF")
                        .requestMatchers(HttpMethod.GET, "/consultations/*").hasAnyRole("SUPER_ADMIN", "ADMIN", "DOCTOR")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
