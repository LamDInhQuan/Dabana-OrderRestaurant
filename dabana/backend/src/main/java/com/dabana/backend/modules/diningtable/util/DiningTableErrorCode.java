package com.dabana.backend.modules.diningtable.util;

import com.dabana.backend.exception.ErrorCode;

public enum DiningTableErrorCode implements ErrorCode {

    BRANCH_NOT_FOUND("DINING_TABLE_BRANCH_NOT_FOUND", "Không tìm thấy chi nhánh"),
    ZONE_NOT_FOUND("DINING_TABLE_ZONE_NOT_FOUND", "Không tìm thấy khu vực"),
    TABLE_NOT_FOUND("DINING_TABLE_NOT_FOUND", "Không tìm thấy bàn ăn"),

    TABLE_ALREADY_EXISTS("DINING_TABLE_ALREADY_EXISTS", "Bàn ăn đã tồn tại trong khu vực này"),

    TABLE_NOT_EMPTY("DINING_TABLE_NOT_EMPTY", "Chỉ được sửa hoặc xóa khi bàn đang ở trạng thái trống"),

    TABLE_HAS_FUTURE_BOOKING("DINING_TABLE_HAS_FUTURE_BOOKING", "Không thể sửa hoặc xóa bàn vì còn lượt đặt trong tương lai"),

    TABLE_OVERLAP("DINING_TABLE_OVERLAP", "Vị trí bàn bị chồng lên nhau, vui lòng điều chỉnh lại sơ đồ"),

    TABLE_CAPACITY_INSUFFICIENT("DINING_TABLE_CAPACITY_INSUFFICIENT", "Sức chứa của bàn không đủ cho số lượng khách"),

    TABLE_UNAVAILABLE("DINING_TABLE_UNAVAILABLE", "Bàn hiện không khả dụng"),

    TABLE_RESERVED("DINING_TABLE_RESERVED", "Bàn đã được đặt trước"),

    TABLE_OCCUPIED("DINING_TABLE_OCCUPIED", "Bàn đang có khách sử dụng"),

    TABLE_CLEANING("DINING_TABLE_CLEANING", "Bàn đang được dọn dẹp"),

    TABLE_MAINTENANCE("DINING_TABLE_MAINTENANCE", "Bàn đang bảo trì"),

    TABLE_HELD("DINING_TABLE_HELD", "Bàn đang được giữ tạm cho một lượt đặt khác"),

    TABLE_HELD_FOR_WAITLIST("DINING_TABLE_HELD_FOR_WAITLIST", "Bàn đang được ưu tiên cho khách trong danh sách chờ"),

    TABLE_NOT_AVAILABLE_AT_TIME("DINING_TABLE_NOT_AVAILABLE_AT_TIME", "Bàn không khả dụng trong khung giờ đã chọn"),

    TABLE_STATUS_INVALID("DINING_TABLE_STATUS_INVALID", "Trạng thái bàn không hợp lệ"),

    AUTO_ASSIGN_FAILED("DINING_TABLE_AUTO_ASSIGN_FAILED", "Không tìm được bàn phù hợp với yêu cầu"),

    NO_AVAILABLE_TABLE("DINING_TABLE_NO_AVAILABLE_TABLE", "Không còn bàn trống phù hợp với yêu cầu");

    private final String code;
    private final String message;

    DiningTableErrorCode(String code, String message) {
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