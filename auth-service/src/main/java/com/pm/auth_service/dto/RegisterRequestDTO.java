package com.pm.auth_service.dto;

import com.pm.auth_service.enums.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegisterRequestDTO {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid email address")
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters long!")
    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Role is required")
    private RoleEnum role;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public RoleEnum getRole() { return role; }
    public void setRole(RoleEnum role) { this.role = role; }
}
