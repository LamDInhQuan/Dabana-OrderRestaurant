package com.dabana.backend.modules.restaurant;

import com.dabana.backend.exception.ErrorCode;
import lombok.Getter;

@Getter
public enum RestaurantErrorCode implements ErrorCode {
    RESTAURANT_NOT_FOUND("RESTAURANT_NOT_FOUND", "Restaurant not found"),
    RESTAURANT_ALREADY_EXISTS("RESTAURANT_ALREADY_EXISTS", "Restaurant already exists"),
    INVALID_RESTAURANT_DATA("INVALID_RESTAURANT_DATA", "Invalid restaurant data");

    private final String code;
    private final String message;

    RestaurantErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}