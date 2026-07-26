package com.dabana.backend.modules.subscription.util;

import com.dabana.backend.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubscriptionErrorCode implements ErrorCode {

    // ==========================
    // Plan
    // ==========================
    PLAN_NOT_FOUND(
            "SUB_001",
            "Không tìm thấy gói dịch vụ yêu cầu."
    ),
    PLAN_INACTIVE(
            "SUB_002",
            "Gói dịch vụ này hiện không còn mở bán."
    ),
    DUPLICATE_PLAN_CODE(
            "SUB_003",
            "Mã gói dịch vụ đã tồn tại."
    ),

    // ==========================
    // Subscription lifecycle
    // ==========================
    SUBSCRIPTION_NOT_FOUND(
            "SUB_101",
            "Nhà hàng chưa có gói dịch vụ đang hoạt động."
    ),
    DUPLICATE_SUBSCRIPTION(
            "SUB_102",
            "Nhà hàng đã có gói dịch vụ đang hoạt động hoặc đang chờ thanh toán."
    ),
    INVALID_PLAN_CHANGE(
            "SUB_103",
            "Thao tác đổi gói không hợp lệ (chỉ được nâng cấp lên gói cao hơn hoặc đặt lịch hạ cấp xuống gói thấp hơn)."
    ),
    RESTAURANT_NOT_FOUND(
            "SUB_104",
            "Không tìm thấy nhà hàng của tài khoản hiện tại."
    ),
    BRANCH_LIMIT_EXCEEDED(
            "SUB_105",
            "Đã đạt giới hạn số chi nhánh của gói hiện tại. Vui lòng nâng cấp gói để tiếp tục thêm chi nhánh."
    ),

    // ==========================
    // Invoice
    // ==========================
    INVOICE_NOT_FOUND(
            "SUB_201",
            "Không tìm thấy hóa đơn yêu cầu."
    ),
    INVOICE_ALREADY_PAID(
            "SUB_202",
            "Hóa đơn này đã được thanh toán trước đó."
    ),
    INVOICE_ALREADY_CANCELLED(
            "SUB_203",
            "Hóa đơn này đã bị hủy, không thể xác nhận thanh toán."
    );

    private final String code;
    private final String message;
}
