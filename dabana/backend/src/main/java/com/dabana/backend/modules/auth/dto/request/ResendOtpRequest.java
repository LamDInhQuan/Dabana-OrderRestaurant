package com.dabana.backend.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Yeu cau gui lai OTP khi nguoi dung khong nhan duoc email hoac ma da het han (B02 buoc 3).
 */
@Data
public class ResendOtpRequest {
    @NotBlank(message = "Email không được để trống")
    private String identifier; // email dung de dang ky
}
