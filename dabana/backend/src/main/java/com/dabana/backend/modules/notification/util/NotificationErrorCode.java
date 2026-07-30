package com.dabana.backend.modules.notification.util;

import com.dabana.backend.exception.ErrorCode;

public enum NotificationErrorCode implements ErrorCode {
    NOTIFICATION_NOT_FOUND("NOTIF_001", "Không tìm thấy thông báo"),
    NOTIFICATION_FORBIDDEN("NOTIF_002", "Bạn không có quyền truy cập thông báo này"),;

    private final String code;
    private final String message;

    NotificationErrorCode(String code, String message) {
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
