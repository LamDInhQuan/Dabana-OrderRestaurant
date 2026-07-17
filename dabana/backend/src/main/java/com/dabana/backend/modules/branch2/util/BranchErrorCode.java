package com.dabana.backend.modules.branch2.util;

import com.dabana.backend.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BranchErrorCode implements ErrorCode {
    // ==========================
    // Branch Business Errors
    // ==========================
    BRANCH_NOT_FOUND(
            "BRANCH_001",
            "Không tìm thấy chi nhánh yêu cầu."
    ),

    RESTAURANT_NOT_FOUND(
            "BRANCH_002",
            "Nhà hàng đối tác không tồn tại."
    ),

    DUPLICATE_PHONE(
            "BRANCH_003",
            "Số điện thoại chi nhánh này đã được đăng ký hệ thống."
    ),

    INVALID_COORDINATES(
            "BRANCH_004",
            "Tọa độ kinh độ hoặc vĩ độ không hợp lệ."
    ),

    BRANCH_NOT_ACTIVE(
            "BRANCH_005",
            "Chi nhánh này hiện đã tạm ngưng hoạt động."
    ),

    // Operating Hour
    // ==========================
    INVALID_OPERATING_TIME(
            "BRANCH_101",
                    "Giờ mở cửa phải nhỏ hơn giờ đóng cửa."
    ),

    OVERLAPPING_OPERATING_HOURS(
            "BRANCH_102",
                    "Các ca hoạt động trong cùng ngày không được chồng lấn."
    ),

    EMPTY_OPERATING_HOURS(
            "BRANCH_103",
                    "Chi nhánh phải có ít nhất một khung giờ hoạt động."
    ),

    DUPLICATE_OPERATING_HOURS(
            "BRANCH_104",
                    "Khung giờ hoạt động bị trùng lặp."
    ),

    INVALID_OPERATING_DURATION(
            "BRANCH_105",
                    "Thời gian hoạt động của một ca không hợp lệ."
    );

    private final String code;
    private final String message;
}
