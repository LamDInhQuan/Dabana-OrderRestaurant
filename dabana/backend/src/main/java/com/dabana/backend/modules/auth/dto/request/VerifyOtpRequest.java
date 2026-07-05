package com.dabana.backend.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank
    private String identifier; // email

    @NotBlank
    private String otpCode;
}