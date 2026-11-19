package com.restomanager.restaurant_service.config;

import com.restomanager.restaurant_service.entity.Role;
import com.restomanager.restaurant_service.entity.User;
import com.restomanager.restaurant_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class UserDataInitializer {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedDefaultUsers() {
        return args -> {
            createIfMissing("admin@restomanager.be", "Sophie Laurent (Gérante)", Role.ADMIN);
            createIfMissing("serveur@restomanager.be", "Lucas Vermeulen (Salle)", Role.WAITER);
            createIfMissing("cuisine@restomanager.be", "Chef Marc Peeters (Cuisine)", Role.KITCHEN);
        };
    }

    private void createIfMissing(String email, String fullName, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            userRepository.save(User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode("password123"))
                    .fullName(fullName)
                    .role(role)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
    }
}