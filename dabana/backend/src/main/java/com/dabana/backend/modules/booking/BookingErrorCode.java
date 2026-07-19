package com.dabana.backend.modules.booking;

import com.dabana.backend.exception.ErrorCode;

public enum BookingErrorCode implements ErrorCode {

    // ========= Booking =========
    BOOKING_NOT_FOUND(
            "BOOKING_NOT_FOUND",
            "Không tìm thấy đơn đặt bàn"
    ),

    BOOKING_ALREADY_CANCELLED(
            "BOOKING_ALREADY_CANCELLED",
            "Đơn đặt bàn đã được hủy"
    ),

    BOOKING_ALREADY_CONFIRMED(
            "BOOKING_ALREADY_CONFIRMED",
            "Đơn đặt bàn đã được xác nhận"
    ),

    BOOKING_EXPIRED(
            "BOOKING_EXPIRED",
            "Phiếu giữ bàn đã hết hạn"
    ),

    BOOKING_CANNOT_UPDATE(
            "BOOKING_CANNOT_UPDATE",
            "Không thể cập nhật đơn đặt bàn ở trạng thái hiện tại"
    ),

    BOOKING_CANNOT_CANCEL(
            "BOOKING_CANNOT_CANCEL",
            "Đơn đặt bàn không thể hủy"
    ),

    // ========= Time =========
    INVALID_RESERVATION_TIME(
            "INVALID_RESERVATION_TIME",
            "Thời gian đặt bàn không hợp lệ"
    ),

    RESERVATION_TIME_UNAVAILABLE(
            "RESERVATION_TIME_UNAVAILABLE",
            "Chi nhánh không hoạt động vào thời gian đã chọn"
    ),

    TIMESLOT_ALREADY_BOOKED(
            "TIMESLOT_ALREADY_BOOKED",
            "Khung giờ này đã được đặt"
    ),

    HOLD_TIME_EXPIRED(
            "HOLD_TIME_EXPIRED",
            "Thời gian giữ bàn đã hết"
    ),

    // ========= Contact =========
    CONTACT_INFO_REQUIRED(
            "CONTACT_INFO_REQUIRED",
            "Vui lòng nhập đầy đủ thông tin liên hệ"
    ),

    // ========= Payment =========
    PAYMENT_REQUIRED(
            "PAYMENT_REQUIRED",
            "Đơn đặt bàn cần hoàn thành thanh toán đặt cọc"
    ),

    PAYMENT_ALREADY_COMPLETED(
            "PAYMENT_ALREADY_COMPLETED",
            "Đơn đặt bàn đã được thanh toán"
    ),

    PAYMENT_FAILED(
            "PAYMENT_FAILED",
            "Thanh toán đặt cọc không thành công"
    ),

    // ========= Pre-order =========
    PREORDER_EMPTY(
            "PREORDER_EMPTY",
            "Danh sách món đặt trước không được để trống"
    ),

    PREORDER_ITEM_NOT_FOUND(
            "PREORDER_ITEM_NOT_FOUND",
            "Không tìm thấy món ăn trong thực đơn"
    ),

    PREORDER_ITEM_NOT_AVAILABLE(
            "PREORDER_ITEM_NOT_AVAILABLE",
            "Món ăn hiện không còn phục vụ"
    ),

    // ========= Booking table =========
    TABLE_ALREADY_ASSIGNED(
            "TABLE_ALREADY_ASSIGNED",
            "Bàn đã được gán cho đơn đặt khác"
    ),

    AUTO_SUGGEST_FAILED(
            "AUTO_SUGGEST_FAILED",
            "Không tìm được bàn phù hợp với số lượng khách"
    ),
    TABLE_IDS_REQUIRED(
            "TABLE_IDS_REQUIRED",
            "Phải cung cấp danh sách table_ids"
    );

    private final String code;
    private final String message;

    BookingErrorCode(String code, String message) {
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