package com.dabana.backend.modules.diningtable.util;

import com.dabana.backend.exception.ErrorCode;

public enum DiningTableErrorCode implements ErrorCode {
    BRANCH_NOT_FOUND("DINING_TABLE_BRANCH_NOT_FOUND", "Khong tim thay chi nhanh"),
    ZONE_NOT_FOUND("DINING_TABLE_ZONE_NOT_FOUND", "Khong tim thay khu vuc"),
    TABLE_NOT_FOUND("DINING_TABLE_NOT_FOUND", "Khong tim thay ban an"),
    TABLE_ALREADY_EXISTS("DINING_TABLE_ALREADY_EXISTS", "Ban an da ton tai trong khu vuc nay"),
    TABLE_NOT_EMPTY("DINING_TABLE_NOT_EMPTY", "Chi duoc sua/xoa khi ban dang o trang thai Trong"),
    TABLE_HAS_FUTURE_BOOKING("DINING_TABLE_HAS_FUTURE_BOOKING", "Khong the sua/xoa ban vi con booking trong tuong lai"),
    TABLE_OVERLAP("DINING_TABLE_OVERLAP", "Vi tri ban bi chong len nhau, vui long dieu chinh lai so do");

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