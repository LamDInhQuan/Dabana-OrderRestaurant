package com.dabana.backend.modules.invoice.util;

import com.dabana.backend.exception.ErrorCode;

public enum InvoiceErrorCode implements ErrorCode {

    INVOICE_ALREADY_PAID(
            "INVOICE_ALREADY_PAID",
            "Đơn này đã được thanh toán trước đó"),

    PAYMENT_METHOD_REQUIRED(
            "PAYMENT_METHOD_REQUIRED",
            "Vui lòng chọn phương thức thanh toán"),

    INVOICE_NOT_FOUND(
            "INVOICE_NOT_FOUND",
            "Không tìm thấy hóa đơn cho đơn đặt bàn này");

    private final String code;
    private final String message;

    InvoiceErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    @Override
    public String getCode() {
        return code;
    }

    @Override
    public String getMessage() {
        return message;
    }
}
