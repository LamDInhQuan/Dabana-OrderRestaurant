package com.dabana.backend.modules.auth.util;

import com.dabana.backend.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuthErrorCode implements ErrorCode {
    // ==========================
    // Authentication
    // ==========================
    INVALID_CREDENTIALS(
            "AUTH_001",
            "Email hoặc mật khẩu không chính xác."
    ),

    ACCOUNT_DISABLED(
            "AUTH_002",
            "Tài khoản đã bị khóa."
    ),

    ACCOUNT_NOT_VERIFIED(
            "AUTH_003",
            "Tài khoản chưa được xác thực."
    ),

    ACCESS_DENIED(
            "AUTH_004",
            "Bạn không có quyền truy cập."
    ),

    ACCOUNT_NOT_VERIFIED_BY_ADMIN(
            "AUTH_005",
            "Tài khoản phải được duyệt bởi admin."
    ),

    // ==========================
    // User
    // ==========================
    USER_NOT_FOUND(
            "AUTH_101",
            "Không tìm thấy người dùng."
    ),

    EMAIL_ALREADY_EXISTS(
            "AUTH_102",
            "Email đã được sử dụng."
    ),

    PHONE_ALREADY_EXISTS(
            "AUTH_103",
            "Số điện thoại đã được sử dụng."
    ),

    ROLE_NOT_FOUND(
            "AUTH_104",
            "Vai trò không tồn tại."
    ),
    EMAIL_NOT_NULL(
            "AUTH_105",
            "Email không được để trống."
    ),

    // ==========================
    // OTP
    // ==========================
    OTP_INVALID(
            "AUTH_201",
            "Mã OTP không hợp lệ."
    ),

    OTP_EXPIRED(
            "AUTH_202",
            "Mã OTP đã hết hạn."
    ),

    OTP_ALREADY_VERIFIED(
            "AUTH_203",
            "OTP đã được xác thực."
    ),

    OTP_SEND_FAILED(
            "AUTH_204",
            "Không thể gửi OTP."
    ),

    OTP_LOCKED(
            "AUTH_205",
            "Đã nhập sai OTP quá 5 lần. Vui lòng thử lại sau 30 phút."
    ),

    OTP_EMAIL_INVAILID(
            "AUTH_206",
            "Otp xác thực email không hợp lệ."
    ),
    OTP_REQUIRED(
            "AUTH_207",
            "Otp không được để trống."
    ),

    // ==========================
    // Password
    // ==========================
    PASSWORD_INCORRECT(
            "AUTH_301",
            "Mật khẩu không chính xác."
    ),

    PASSWORD_CONFIRM_NOT_MATCH(
            "AUTH_302",
            "Xác nhận mật khẩu không khớp."
    ),

    PASSWORD_TOO_WEAK(
            "AUTH_303",
            "Mật khẩu không đủ mạnh."
            
    ),
    NEW_PASSWORD_SAME_AS_OLD(
            "AUTH_304",
            "Mật khẩu mới phải khác mật khẩu hiện tại."
        ),

    // ==========================
    // Token
    // ==========================
    TOKEN_INVALID(
            "AUTH_401",
            "Token không hợp lệ."
    ),

    TOKEN_EXPIRED(
            "AUTH_402",
            "Token đã hết hạn."
    ),

    REFRESH_TOKEN_INVALID(
            "AUTH_403",
            "Refresh Token không hợp lệ."
    ),

    REFRESH_TOKEN_EXPIRED(
            "AUTH_404",
            "Refresh Token đã hết hạn."
    );


    private final String code;
    private final String message;
}
