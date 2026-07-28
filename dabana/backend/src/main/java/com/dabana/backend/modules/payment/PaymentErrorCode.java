package com.dabana.backend.modules.payment;

import com.dabana.backend.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PaymentErrorCode implements ErrorCode {
    PAYMENT_NOT_FOUND("PAYMENT_40401", "Không tìm thấy thông tin thanh toán"),
    PAYMENT_CREATE_FAILED("PAYMENT_40001", "Tạo link thanh toán thất bại"),
    PAYMENT_EXPIRED("PAYMENT_40002", "Phiên thanh toán đã hết hạn"),
    PAY_OS_ERROR("PAYMENT_50001", "Lỗi kết nối tới cổng thanh toán PayOS"),
    REFUND_FAILED("PAYMENT_40003", "Hoàn tiền thất bại");

    private final String code;
    private final String message;
}