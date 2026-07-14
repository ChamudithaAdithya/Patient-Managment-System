package com.pm.auth_service.service;

import com.pm.auth_service.dto.LoginRequestDTO;
import com.pm.auth_service.dto.RegisterRequestDTO;
import com.pm.auth_service.enums.RoleEnum;
import com.pm.auth_service.model.User;
import com.pm.auth_service.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private AuthService(UserService userService,PasswordEncoder passwordEncoder,JwtUtil jwtUtil){
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }
    public Optional<String> authenticate(LoginRequestDTO loginRequestDTO){
        return userService.findByEmail(loginRequestDTO.getEmail())
                .filter(u->passwordEncoder.matches(loginRequestDTO.getPassword(),u.getPassword()))
                .filter(User::isActive)
                .map(u->jwtUtil.generateToken(u.getEmail(), u.getRole(), u.getName()));
    }

    public Optional<String> register(RegisterRequestDTO request) {
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            return Optional.empty();
        }
        if (request.getRole() == RoleEnum.SUPER_ADMIN || request.getRole() == RoleEnum.ADMIN || request.getRole() == RoleEnum.STAFF) {
            return Optional.empty();
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        userService.createUser(user);
        return Optional.of(jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getName()));
    }
}
