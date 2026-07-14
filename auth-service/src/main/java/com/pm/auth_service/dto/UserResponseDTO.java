package com.pm.auth_service.dto;

import com.pm.auth_service.enums.RoleEnum;

import java.util.UUID;

public class UserResponseDTO {
    private UUID id;
    private String name;
    private String email;
    private RoleEnum role;
    private boolean active;
    private UUID createdBy;

    public UserResponseDTO(UUID id, String name, String email, RoleEnum role, boolean active, UUID createdBy) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.active = active;
        this.createdBy = createdBy;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public RoleEnum getRole() { return role; }
    public boolean isActive() { return active; }
    public UUID getCreatedBy() { return createdBy; }
}
