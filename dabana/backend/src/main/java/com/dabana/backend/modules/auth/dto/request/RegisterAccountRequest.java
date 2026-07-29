package com.dabana.backend.modules.auth.dto.request;

import com.dabana.backend.modules.auth.util.RoleUser;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
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

    /** CUSTOMER hoặc RESTAURANT_PARTNER — mặc định CUSTOMER nếu không gửi */
    private RoleUser role;

    // --- Bổ sung thêm các trường thông tin nhà hàng ban đầu ---
    @Size(max = 250, message = "Tên nhà hàng tối đa 250 ký tự")
    private String restaurantName;

    @Pattern(
            regexp = "^(0|\\+84)[0-9]{9}$",
            message = "Số điện thoại nhà hàng không hợp lệ"
    )
    private String restaurantPhone;

    private String description;

    @Size(max = 255, message = "Website tối đa 255 ký tự")
    private String website;

}