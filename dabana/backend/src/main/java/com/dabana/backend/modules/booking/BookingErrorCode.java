package com.dabana.backend.modules.booking;

import com.dabana.backend.exception.ErrorCode;

public enum BookingErrorCode implements ErrorCode {

        // ========= Booking =========
        BOOKING_NOT_FOUND(
                        "BOOKING_NOT_FOUND",
                        "Không tìm thấy đơn đặt bàn"),

        BOOKING_ALREADY_CANCELLED(
                        "BOOKING_ALREADY_CANCELLED",
                        "Đơn đặt bàn đã được hủy"),

        BOOKING_ALREADY_CONFIRMED(
                        "BOOKING_ALREADY_CONFIRMED",
                        "Đơn đặt bàn đã được xác nhận"),

        BOOKING_EXPIRED(
                        "BOOKING_EXPIRED",
                        "Phiếu giữ bàn đã hết hạn"),

        BOOKING_CANNOT_UPDATE(
                        "BOOKING_CANNOT_UPDATE",
                        "Không thể cập nhật đơn đặt bàn ở trạng thái hiện tại"),

        BOOKING_CANNOT_CANCEL(
                        "BOOKING_CANNOT_CANCEL",
                        "Đơn đặt bàn không thể hủy"),

        BOOKING_CANNOT_CHECK_IN(
                        "BOOKING_CANNOT_CHECK_IN",
                        "Chỉ có thể check-in đơn đang ở trạng thái Đã xác nhận hoặc Nghi No-show"),

        BOOKING_CANNOT_CHECK_OUT(
                        "BOOKING_CANNOT_CHECK_OUT",
                        "Chỉ có thể check-out đơn đang phục vụ (Đã check-in)"),

        BOOKING_CANNOT_MARK_NO_SHOW(
                        "BOOKING_CANNOT_MARK_NO_SHOW",
                        "Chỉ có thể chốt No-show cho đơn Đã xác nhận hoặc đang Nghi No-show"),

        // ========= Time =========
        INVALID_RESERVATION_TIME(
                        "INVALID_RESERVATION_TIME",
                        "Thời gian đặt bàn không hợp lệ"),

        RESERVATION_TIME_UNAVAILABLE(
                        "RESERVATION_TIME_UNAVAILABLE",
                        "Chi nhánh không hoạt động vào thời gian đã chọn"),

        TIMESLOT_ALREADY_BOOKED(
                        "TIMESLOT_ALREADY_BOOKED",
                        "Khung giờ này đã được đặt"),

        HOLD_TIME_EXPIRED(
                        "HOLD_TIME_EXPIRED",
                        "Thời gian giữ bàn đã hết"),

        // ========= Contact =========
        CONTACT_INFO_REQUIRED(
                        "CONTACT_INFO_REQUIRED",
                        "Vui lòng nhập đầy đủ thông tin liên hệ"),

        // ========= Payment =========
        PAYMENT_REQUIRED(
                        "PAYMENT_REQUIRED",
                        "Đơn đặt bàn cần hoàn thành thanh toán đặt cọc"),

        PAYMENT_ALREADY_COMPLETED(
                        "PAYMENT_ALREADY_COMPLETED",
                        "Đơn đặt bàn đã được thanh toán"),

        PAYMENT_FAILED(
                        "PAYMENT_FAILED",
                        "Thanh toán đặt cọc không thành công"),

        // ========= Pre-order =========
        PREORDER_EMPTY(
                        "PREORDER_EMPTY",
                        "Danh sách món đặt trước không được để trống"),

        PREORDER_ITEM_NOT_FOUND(
                        "PREORDER_ITEM_NOT_FOUND",
                        "Không tìm thấy món ăn trong thực đơn"),

        PREORDER_ITEM_NOT_AVAILABLE(
                        "PREORDER_ITEM_NOT_AVAILABLE",
                        "Món ăn hiện không còn phục vụ"),

        // Tab Goi Mon: sua/xoa mon dat truoc (rs_preorder_items) chi cho phep khi
        // booking dang CONFIRMED/CHECKED_IN - dung boi BookingItemService.
        PREORDER_ITEM_NOT_EDITABLE(
                        "PREORDER_ITEM_NOT_EDITABLE",
                        "Chỉ có thể sửa/xoá món đặt trước khi đơn đang Đã xác nhận hoặc Đang phục vụ"),

        // ========= Booking table =========
        TABLE_ALREADY_ASSIGNED(
                        "TABLE_ALREADY_ASSIGNED",
                        "Bàn đã được gán cho đơn đặt khác"),

        AUTO_SUGGEST_FAILED(
                        "AUTO_SUGGEST_FAILED",
                        "Không tìm được bàn phù hợp với số lượng khách"),
        WALK_IN_TABLE_NOT_EMPTY(
                        "WALK_IN_TABLE_NOT_EMPTY",
                        "Chỉ có thể nhận khách vãng lai vào bàn đang ở trạng thái Trống"),
        TABLE_IDS_REQUIRED(
                        "TABLE_IDS_REQUIRED",
                        "Phải cung cấp danh sách table_ids");

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