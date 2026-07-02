package com.dabana.backend.modules.auth.dto;

import com.dabana.backend.modules.auth.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Ho ten khong duoc de trong")
        private String fullName;

        @Email(message = "Email khong hop le")
        private String email;

        private String phone;

        @NotBlank
        @Size(min = 6, message = "Mat khau toi thieu 6 ky tu")
        private String password;

        @NotBlank
        private UserRole role; // CUSTOMER hoac RESTAURANT_PARTNER (B02)
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Vui long nhap email hoac so dien thoai")
        private String identifier; // email hoac phone

        @NotBlank
        private String password;
    }

    @Data
    public static class VerifyOtpRequest {
        @NotBlank
        private String identifier;

        @NotBlank
        private String otpCode;
    }

    @Data
    public static class RefreshTokenRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private Long userId;
        private String fullName;
        private String role;
        private String status;
    }
}
