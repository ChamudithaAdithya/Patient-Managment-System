package com.pm.auth_service.controller;

import com.pm.auth_service.dto.ErrorResponseDTO;
import com.pm.auth_service.dto.LoginRequestDTO;
import com.pm.auth_service.dto.LoginResponseDTO;
import com.pm.auth_service.dto.RegisterRequestDTO;
import com.pm.auth_service.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
public class AuthController {

    private final AuthService authService;
    public AuthController(AuthService authService){
        this.authService = authService;
    }

    @Operation(summary = "Generate token on user login")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginRequestDTO){
        Optional<String> tokenOptional = authService.authenticate(loginRequestDTO);
        if(tokenOptional.isEmpty()){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponseDTO("Invalid email or password"));
        }
        String token = tokenOptional.get();
        return ResponseEntity.status(HttpStatus.OK).body(new LoginResponseDTO(token));
    }

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO request) {
        Optional<String> tokenOptional = authService.register(request);
        if (tokenOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponseDTO("Email already in use"));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(new LoginResponseDTO(tokenOptional.get()));
    }
}
