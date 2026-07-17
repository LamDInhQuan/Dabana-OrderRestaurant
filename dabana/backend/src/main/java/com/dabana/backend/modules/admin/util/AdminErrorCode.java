package com.dabana.backend.modules.admin.util;

import com.dabana.backend.exception.ErrorCode;

public enum AdminErrorCode implements ErrorCode {
    USER_NOT_FOUND("ADMIN_001", "Khong tim thay nguoi dung"),
    RESTAURANT_NOT_FOUND("ADMIN_002", "Khong tim thay nha hang"),
    BRANCH_NOT_FOUND("ADMIN_003", "Khong tim thay chi nhanh"),
    REVIEW_NOT_FOUND("ADMIN_004", "Khong tim thay danh gia"),
    CATEGORY_NOT_FOUND("ADMIN_005", "Khong tim thay danh muc"),
    INVALID_STATE("ADMIN_006", "Doi tuong khong o trang thai phu hop de thuc hien thao tac nay"),
    CANNOT_LOCK_ADMIN("ADMIN_007", "Khong the khoa tai khoan Quan tri vien"),
    CATEGORY_ALREADY_EXISTS("ADMIN_008", "Danh muc da ton tai");

    private final String code;
    private final String message;

    AdminErrorCode(String code, String message) {
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
