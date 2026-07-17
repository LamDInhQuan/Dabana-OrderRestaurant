package com.dabana.backend.modules.auth.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterAccountRequest {
    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 150)
    private String fullName;

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    @Size(max = 150)
    private String email;

    @Pattern(
            regexp = "^(0|\\+84)[0-9]{9}$",
            message = "Số điện thoại không hợp lệ"
    )
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 50)
    private String password;

}