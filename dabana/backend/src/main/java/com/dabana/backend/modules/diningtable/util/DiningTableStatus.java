package com.dabana.backend.modules.diningtable.util;

public enum DiningTableStatus {
    EMPTY(1),
    RESERVED(2),
    OCCUPIED(3),
    CLEANING(4),
    MAINTENANCE(5);

    private final int code;

    DiningTableStatus(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public static DiningTableStatus fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (DiningTableStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown dining table status code: " + code);
    }
}