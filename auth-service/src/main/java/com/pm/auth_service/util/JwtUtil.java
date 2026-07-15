package com.pm.auth_service.util;

import com.pm.auth_service.enums.RoleEnum;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {
    private final Key secretKey;
    public JwtUtil(@Value("${secret.key}") String secret){
        byte[] keyBytes = Base64.getDecoder().decode(secret.getBytes(StandardCharsets.UTF_8));
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email, RoleEnum role){
        return Jwts.builder()
                .subject(email)
                .claim("role",role.toString())
                .claim("name", "")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*60*10)) // 10 Hours
                .signWith(secretKey)
                .compact();
    }

    public String generateToken(String email, RoleEnum role, String name){
        return Jwts.builder()
                .subject(email)
                .claim("role",role.toString())
                .claim("name", name != null ? name : "")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*60*10)) // 10 Hours
                .signWith(secretKey)
                .compact();
    }


}
