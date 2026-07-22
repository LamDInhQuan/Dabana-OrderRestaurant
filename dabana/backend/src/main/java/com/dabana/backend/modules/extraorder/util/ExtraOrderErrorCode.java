package com.dabana.backend.modules.extraorder.util;

import com.dabana.backend.exception.ErrorCode;

/**
 * Ma loi cho module Extra Order (mon goi them - Tab Goi mon, task 3).
 */
public enum ExtraOrderErrorCode implements ErrorCode {

    EXTRA_ORDER_NOT_FOUND(
            "EXTRA_ORDER_NOT_FOUND",
            "Không tìm thấy dòng món gọi thêm"
    ),

    EXTRA_ORDER_ITEM_NOT_FOUND(
            "EXTRA_ORDER_ITEM_NOT_FOUND",
            "Không tìm thấy món ăn trong thực đơn"
    ),

    EXTRA_ORDER_ITEM_NOT_AVAILABLE(
            "EXTRA_ORDER_ITEM_NOT_AVAILABLE",
            "Món ăn hiện không còn phục vụ"
    ),

    BOOKING_NOT_CHECKED_IN(
            "EXTRA_ORDER_BOOKING_NOT_CHECKED_IN",
            "Chỉ có thể gọi thêm món khi khách đã check-in"
    ),

    INVALID_QUANTITY(
            "EXTRA_ORDER_INVALID_QUANTITY",
            "Số lượng món phải lớn hơn 0"
    ),

    RECORDED_BY_USER_REQUIRED(
            "EXTRA_ORDER_RECORDED_BY_USER_REQUIRED",
            "Không xác định được nhân viên thực hiện thao tác, vui lòng đăng nhập lại"
    );

    private final String code;
    private final String message;

    ExtraOrderErrorCode(String code, String message) {
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