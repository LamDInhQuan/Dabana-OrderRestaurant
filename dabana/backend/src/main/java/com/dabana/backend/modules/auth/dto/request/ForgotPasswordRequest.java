package com.dabana.backend.modules.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Yeu cau quen mat khau: nguoi dung nhap email da dang ky,
 * he thong sinh mat khau moi va gui ve email do.
 */
@Data
public class ForgotPasswordRequest {
    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;
}
