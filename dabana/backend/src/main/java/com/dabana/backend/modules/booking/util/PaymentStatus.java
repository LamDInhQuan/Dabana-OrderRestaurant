package com.dabana.backend.modules.booking.util;

public enum PaymentStatus {
    NOT_REQUIRED,       // Không yêu cầu cọc
    PENDING_PAYMENT,    // Chờ thanh toán
    PAID,               // Đã thanh toán
    PENDING_REFUND,     // Đang hoàn tiền
    REFUNDED,           // Đã hoàn tiền
    FAILED              // Thanh toán hoặc hoàn tiền thất bại
}