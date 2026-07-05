package com.dabana.backend.modules.auth.util;

import lombok.Getter;

/**
 * Trang thai tai khoan - ap dung cho B02 (dang ky doi tac voi luong duyet).
 */
@Getter
public enum AccountStatus {
    PENDING_OTP(1),    // Cho xac thuc OTP
    PENDING_ADMIN(2),  // Cho quan tri vien duyet (B02 buoc 4)
    ACTIVE(3),         // Da kich hoat
    REJECTED(4),       // Bi tu choi (B02 EF04)
    SUSPENDED(5);     // Bi khoa

    AccountStatus(Integer status) {
        this.status = status;
    }

    private final Integer status;
}
