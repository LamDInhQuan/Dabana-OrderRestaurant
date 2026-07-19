package com.dabana.backend.modules.zone.util;

import com.dabana.backend.exception.ErrorCode;

public enum ZoneErrorCode implements ErrorCode {
    BRANCH_NOT_FOUND("ZONE_BRANCH_NOT_FOUND", "Khong tim thay chi nhanh"),
    ZONE_NOT_FOUND("ZONE_NOT_FOUND", "Khong tim thay khu vuc"),
    ZONE_ALREADY_EXISTS("ZONE_ALREADY_EXISTS", "Khu vuc da ton tai trong chi nhanh nay"),
    ZONE_HAS_TABLES("ZONE_HAS_TABLES", "Khong the xoa khu vuc khi con ban an"),
    ZONE_HAS_FUTURE_BOOKINGS("ZONE_HAS_FUTURE_BOOKINGS", "Khong the xoa khu vuc vi con booking trong tuong lai"),
    FLOOR_PLAN_NOT_FOUND("FLOOR_PLAN_NOT_FOUND", "Khong tim thay floor plan cho khu vuc"),
    INVALID_FLOOR_PLAN_LAYOUT("INVALID_FLOOR_PLAN_LAYOUT", "Dinh dang floor plan khong hop le"),
    FLOOR_PLAN_DATA_CORRUPTED("FLOOR_PLAN_DATA_CORRUPTED", "Du lieu layout_data hien tai bi loi, khong the dong bo"),
    FLOOR_PLAN_TABLE_REF_INVALID("FLOOR_PLAN_TABLE_REF_INVALID", "layout_data tham chieu toi ban an khong hop le hoac khong thuoc khu vuc nay");

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