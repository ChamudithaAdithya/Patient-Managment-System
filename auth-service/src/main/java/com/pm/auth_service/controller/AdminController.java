package com.pm.auth_service.controller;

import com.pm.auth_service.dto.*;
import com.pm.auth_service.enums.RoleEnum;
import com.pm.auth_service.model.User;
import com.pm.auth_service.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody AdminCreateRequest request, Authentication auth) {
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponseDTO("Email already in use"));
        }
        User admin = new User();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(RoleEnum.ADMIN);
        String creatorEmail = auth != null ? auth.getName() : null;
        if (creatorEmail != null) {
            userService.findByEmail(creatorEmail).ifPresent(c -> admin.setCreatedBy(c.getId()));
        }
        userService.createUser(admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(admin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable UUID id) {
        if (userService.findById(id).map(u -> u.getRole() != RoleEnum.ADMIN).orElse(true)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponseDTO("Admin not found"));
        }
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userService.getAllActive().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(@Valid @RequestBody StaffCreateRequest request, Authentication auth) {
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponseDTO("Email already in use"));
        }
        User staff = new User();
        staff.setName(request.getName());
        staff.setEmail(request.getEmail());
        staff.setPassword(passwordEncoder.encode(request.getPassword()));
        staff.setRole(RoleEnum.STAFF);
        String creatorEmail = auth != null ? auth.getName() : null;
        if (creatorEmail != null) {
            userService.findByEmail(creatorEmail).ifPresent(c -> staff.setCreatedBy(c.getId()));
        }
        userService.createUser(staff);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(staff));
    }

    @GetMapping("/staff")
    public ResponseEntity<List<UserResponseDTO>> getAllStaff() {
        List<UserResponseDTO> staff = userService.getByRole(RoleEnum.STAFF).stream()
                .filter(User::isActive)
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(staff);
    }

    @DeleteMapping("/staff/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable UUID id) {
        if (userService.findById(id).map(u -> u.getRole() != RoleEnum.STAFF).orElse(true)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponseDTO("Staff not found"));
        }
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }

    private UserResponseDTO toDTO(User user) {
        return new UserResponseDTO(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive(), user.getCreatedBy());
    }
}
