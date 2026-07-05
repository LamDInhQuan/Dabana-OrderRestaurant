package com.dabana.backend.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Vui long nhap email hoac so dien thoai")
    private String identifier; // email hoac phone

    @NotBlank
    private String password;
}