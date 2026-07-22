package com.dabana.backend.modules.branch2.util;

import com.dabana.backend.exception.ErrorCode;

public enum BranchCancellationPolicyErrorCode implements ErrorCode {

    POLICY_NOT_FOUND(
            "BRANCH_CANCELLATION_POLICY_NOT_FOUND",
            "Không tìm thấy chính sách hủy của chi nhánh"),

    POLICY_ALREADY_EXISTS(
            "BRANCH_CANCELLATION_POLICY_ALREADY_EXISTS",
            "Chi nhánh đã có chính sách hủy"),

    INVALID_REFUND_PERCENT(
            "INVALID_REFUND_PERCENT",
            "Tỷ lệ hoàn tiền không hợp lệ");

    private final String code;
    private final String message;

    BranchCancellationPolicyErrorCode(String code, String message) {
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