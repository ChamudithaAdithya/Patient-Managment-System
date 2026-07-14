package com.pm.auth_service.config;

import com.pm.auth_service.enums.RoleEnum;
import com.pm.auth_service.model.User;
import com.pm.auth_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("chamuditha@hospital.com").isEmpty()) {
            User superAdmin = new User();
            superAdmin.setName("Chamuditha");
            superAdmin.setEmail("chamuditha@hospital.com");
            superAdmin.setPassword(passwordEncoder.encode("Admin@123"));
            superAdmin.setRole(RoleEnum.SUPER_ADMIN);
            userRepository.save(superAdmin);
        }
    }
}
