package com.dabana.backend.modules.auth;

/**
 * Trang thai tai khoan - ap dung cho B02 (dang ky doi tac voi luong duyet).
 */
public enum AccountStatus {
    PENDING_OTP,    // Cho xac thuc OTP
    PENDING_ADMIN,  // Cho quan tri vien duyet (B02 buoc 4)
    ACTIVE,         // Da kich hoat
    REJECTED,       // Bi tu choi (B02 EF04)
    SUSPENDED       // Bi khoa
}
