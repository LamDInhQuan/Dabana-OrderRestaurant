package com.dabana.backend.modules.menu.util;

public enum MenuItemStatus {
    SELLING(1),
    OUT_OF_STOCK(0),
    DISCONTINUED(-1);

    private final int code;

    MenuItemStatus(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public static MenuItemStatus fromCode(Integer code) {
        if (code == null) {
            return SELLING;
        }
        for (MenuItemStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        throw new IllegalArgumentException("Khong tim thay trang thai mon an: " + code);
    }
}