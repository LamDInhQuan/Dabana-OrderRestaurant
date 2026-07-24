package com.dabana.backend.modules.review.util;

import com.dabana.backend.exception.ErrorCode;

/**
 * Ma loi cho module Danh gia (B13 - danh gia chi nhanh sau khi don hoan tat).
 */
public enum ReviewErrorCode implements ErrorCode {

    BOOKING_NOT_FOUND(
            "REVIEW_BOOKING_NOT_FOUND",
            "Không tìm thấy đơn đặt bàn"
    ),

    BOOKING_NOT_COMPLETED(
            "REVIEW_BOOKING_NOT_COMPLETED",
            "Chỉ có thể đánh giá đơn đặt bàn đã hoàn tất"
    ),

    FORBIDDEN(
            "REVIEW_FORBIDDEN",
            "Bạn không có quyền đánh giá đơn đặt bàn này"
    ),

    ALREADY_REVIEWED(
            "REVIEW_ALREADY_REVIEWED",
            "Đơn đặt bàn này đã được đánh giá"
    ),

    REVIEW_NOT_FOUND(
            "REVIEW_NOT_FOUND",
            "Không tìm thấy đánh giá"
    );

    private final String code;
    private final String message;

    ReviewErrorCode(String code, String message) {
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
