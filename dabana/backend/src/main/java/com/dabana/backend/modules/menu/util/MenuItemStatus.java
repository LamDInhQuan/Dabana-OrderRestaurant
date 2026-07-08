package com.dabana.backend.modules.menu.util;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Locale;

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

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static MenuItemStatus fromJson(JsonNode node) {
        if (node == null || node.isNull()) {
            return SELLING;
        }

        if (node.isNumber()) {
            return fromCode(node.intValue());
        }

        if (node.isTextual()) {
            String value = node.asText().trim();
            if (value.isEmpty()) {
                return SELLING;
            }

            try {
                return fromCode(Integer.parseInt(value));
            } catch (NumberFormatException ignored) {
                return valueOf(value.toUpperCase(Locale.ROOT));
            }
        }

        throw new IllegalArgumentException("Khong tim thay trang thai mon an: " + node);
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