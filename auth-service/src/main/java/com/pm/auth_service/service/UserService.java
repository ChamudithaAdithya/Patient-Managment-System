package com.pm.auth_service.service;

import com.pm.auth_service.enums.RoleEnum;
import com.pm.auth_service.model.User;
import com.pm.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    private final  UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public List<User> getAllActive() {
        return userRepository.findByActiveTrue();
    }

    public List<User> getByRole(RoleEnum role) {
        return userRepository.findByRole(role);
    }

    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    public void deactivateUser(UUID id) {
        userRepository.findById(id).ifPresent(u -> {
            u.setActive(false);
            userRepository.save(u);
        });
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }
}
