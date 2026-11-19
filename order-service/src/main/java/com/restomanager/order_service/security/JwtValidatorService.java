package com.restomanager.order_service.security;

import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JwtValidatorService {
    private static final String SECRET = "RestoManagerProSecretKey2026EAFCNamurCadetsMin32Chars!";

    public record JwtClaims(String userId, String email, String role) {}

    public JwtClaims parseAndValidate(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) throw new IllegalArgumentException("Token JWT invalide");

        String expectedSig = sign(parts[0] + "." + parts[1]);
        if (!expectedSig.equals(parts[2])) throw new IllegalArgumentException("Signature JWT invalide");

        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        long exp = Long.parseLong(extractJsonValue(payloadJson, "\"exp\":(\\d+)"));
        if (Instant.now().getEpochSecond() > exp) throw new IllegalArgumentException("Token JWT expiré");

        String sub = extractJsonValue(payloadJson, "\"sub\":\"([^\"]+)\"");
        String email = extractJsonValue(payloadJson, "\"email\":\"([^\"]+)\"");
        String role = extractJsonValue(payloadJson, "\"role\":\"([^\"]+)\"");
        return new JwtClaims(sub, email, role);
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Erreur signature HMAC", e);
        }
    }

    private String extractJsonValue(String json, String regex) {
        Matcher m = Pattern.compile(regex).matcher(json);
        if (m.find()) return m.group(1);
        throw new IllegalArgumentException("Champ manquant dans le payload JWT");
    }
}