package com.dabana.backend.modules.reservation_policy.util;

import com.dabana.backend.exception.ErrorCode;

public enum PolicyErrorCode implements ErrorCode {

    RESTAURANT_NOT_FOUND(
            "POLICY_RESTAURANT_NOT_FOUND",
            "Khong tim thay nha hang"
    ),

    BRANCH_NOT_FOUND(
            "POLICY_BRANCH_NOT_FOUND",
            "Khong tim thay chi nhanh"
    ),

    POLICY_NOT_FOUND(
            "POLICY_NOT_FOUND",
            "Khong tim thay chinh sach dat ban"
    ),

    POLICY_ALREADY_EXISTS(
            "POLICY_ALREADY_EXISTS",
            "Ma chinh sach da ton tai trong nha hang"
    ),

    POLICY_IN_USE(
            "POLICY_IN_USE",
            "Chinh sach dang duoc ap dung, khong the xoa"
    ),

    POLICY_ALREADY_ACTIVE(
            "POLICY_ALREADY_ACTIVE",
            "Chinh sach da duoc kich hoat"
    ),

    POLICY_ALREADY_INACTIVE(
            "POLICY_ALREADY_INACTIVE",
            "Chinh sach da ngung hoat dong"
    ),

    INVALID_POLICY_STATUS(
            "POLICY_STATUS_INVALID",
            "Trang thai chinh sach khong hop le"
    ),

    INVALID_DEPOSIT_AMOUNT(
            "POLICY_DEPOSIT_AMOUNT_INVALID",
            "So tien dat coc khong hop le"
    ),

    INVALID_REFUND_RULE(
            "POLICY_REFUND_RULE_INVALID",
            "Quy tac hoan coc khong hop le"
    ),

    REFUND_RULE_NOT_FOUND(
            "POLICY_REFUND_RULE_NOT_FOUND",
            "Khong tim thay quy tac hoan coc"
    ),

    DUPLICATE_REFUND_RULE(
            "POLICY_DUPLICATE_REFUND_RULE",
            "Quy tac hoan coc da ton tai"
    ),

    BRANCH_POLICY_NOT_FOUND(
            "POLICY_BRANCH_POLICY_NOT_FOUND",
            "Khong tim thay cau hinh chinh sach cua chi nhanh"
    ),

    BRANCH_POLICY_ALREADY_EXISTS(
            "POLICY_BRANCH_POLICY_ALREADY_EXISTS",
            "Chinh sach nay da duoc gan cho chi nhanh"
    ),

    INVALID_POLICY_ASSIGNMENT(
            "POLICY_ASSIGNMENT_INVALID",
            "Chinh sach khong thuoc nha hang cua chi nhanh"
    ),

    DEPOSIT_RULE_NOT_FOUND(
            "POLICY_DEPOSIT_RULE_NOT_FOUND",
            "Khong tim thay quy tac dat coc"
    ),

    INVALID_DEPOSIT_RULE(
            "POLICY_DEPOSIT_RULE_INVALID",
            "Quy tac dat coc khong hop le"
    ),

    SCHEDULE_NOT_FOUND(
            "POLICY_SCHEDULE_NOT_FOUND",
            "Khong tim thay lich ap dung"
    ),

    INVALID_SCHEDULE(
            "POLICY_SCHEDULE_INVALID",
            "Lich ap dung khong hop le"
    ) ,
    POLICY_SCHEDULE_ALREADY_EXISTS(
            "POLICY_SCHEDULE_ALREADY_EXISTS",
            "Chính sách này đã có lịch áp dụng"
    ),

    POLICY_SCHEDULE_DUPLICATE_DAY(
            "POLICY_SCHEDULE_DUPLICATE_DAY",
            "Thứ trong tuần đã tồn tại"
    ),

    POLICY_SCHEDULE_DATE_RANGE_OVERLAP(
            "POLICY_SCHEDULE_DATE_RANGE_OVERLAP",
            "Khoảng ngày bị chồng chéo"
    );

    private final String code;
    private final String message;

    PolicyErrorCode(String code, String message) {
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