package com.dabana.backend.modules.zone.util;

import com.dabana.backend.exception.ErrorCode;

public enum ZoneErrorCode implements ErrorCode {
    BRANCH_NOT_FOUND("ZONE_BRANCH_NOT_FOUND", "Khong tim thay chi nhanh"),
    ZONE_NOT_FOUND("ZONE_NOT_FOUND", "Khong tim thay khu vuc"),
    ZONE_ALREADY_EXISTS("ZONE_ALREADY_EXISTS", "Khu vuc da ton tai trong chi nhanh nay"),
    ZONE_HAS_TABLES("ZONE_HAS_TABLES", "Khong the xoa khu vuc khi con ban an"),
    ZONE_HAS_FUTURE_BOOKINGS("ZONE_HAS_FUTURE_BOOKINGS", "Khong the xoa khu vuc vi con booking trong tuong lai");

    private final String code;
    private final String message;

    ZoneErrorCode(String code, String message) {
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