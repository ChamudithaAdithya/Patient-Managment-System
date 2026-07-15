package com.pm.auth_service.model;

import com.pm.auth_service.enums.RoleEnum;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    @Column(nullable = false,unique = true)
    private String email;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleEnum role;
    @Column(nullable = false)
    private String password;

    @Column
    private String name;

    @Column(name = "is_active")
    private Boolean active = true;

    @Column(nullable = true)
    private UUID createdBy;

    public User() {}

    public User(UUID id, String email, RoleEnum role, String password, String name) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.password = password;
        this.name = name;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public RoleEnum getRole() { return role; }
    public void setRole(RoleEnum role) { this.role = role; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean isActive() { return active != null ? active : true; }
    public void setActive(Boolean active) { this.active = active; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
}
