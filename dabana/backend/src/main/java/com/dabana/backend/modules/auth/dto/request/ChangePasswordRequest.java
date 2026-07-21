package com.dabana.backend.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Yeu cau doi mat khau: nguoi dung da dang nhap nhap mat khau hien tai
 * de xac thuc, roi nhap mat khau moi (kem xac nhan).
 */
@Data
public class ChangePasswordRequest {
    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, message = "Mật khẩu mới phải có ít nhất 6 ký tự")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;
}
