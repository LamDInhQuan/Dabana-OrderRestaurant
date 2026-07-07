package com.dabana.backend.modules.menu.util;

import com.dabana.backend.exception.ErrorCode;

public enum MenuErrorCode implements ErrorCode {
    BRANCH_NOT_FOUND("MENU_BRANCH_NOT_FOUND", "Khong tim thay chi nhanh"),
    CATEGORY_NOT_FOUND("MENU_CATEGORY_NOT_FOUND", "Khong tim thay danh muc mon"),
    MENU_ITEM_NOT_FOUND("MENU_ITEM_NOT_FOUND", "Khong tim thay mon an"),
    MENU_ITEM_IMAGE_NOT_FOUND("MENU_ITEM_IMAGE_NOT_FOUND", "Khong tim thay anh mon an"),
    CATEGORY_ALREADY_EXISTS("MENU_CATEGORY_ALREADY_EXISTS", "Danh muc da ton tai trong chi nhanh"),
    MENU_ITEM_ALREADY_EXISTS("MENU_ITEM_ALREADY_EXISTS", "Mon an da ton tai trong danh muc"),
    INVALID_MENU_ITEM_STATUS("MENU_ITEM_STATUS_INVALID", "Trang thai mon an khong hop le");

    private final String code;
    private final String message;

    MenuErrorCode(String code, String message) {
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