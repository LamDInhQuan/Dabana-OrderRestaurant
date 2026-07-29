package com.dabana.backend.modules.payment.util;

import com.dabana.backend.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentErrorCode implements ErrorCode {

    // ==========================
    // Bank catalog
    // ==========================
    BANK_NOT_FOUND("PM_001", "Không tìm thấy ngân hàng trong danh mục."),
    BANK_INACTIVE("PM_002", "Ngân hàng này hiện không khả dụng để chọn."),

    // ==========================
    // Branch bank account
    // ==========================
    BRANCH_NOT_FOUND("PM_100", "Không tìm thấy chi nhánh."),
    BRANCH_BANK_ACCOUNT_NOT_FOUND("PM_101", "Chi nhánh chưa cấu hình tài khoản ngân hàng nhận cọc."),
    BRANCH_BANK_ACCOUNT_ALREADY_EXISTS("PM_102", "Chi nhánh này đã có tài khoản ngân hàng, vui lòng cập nhật thay vì tạo mới."),
    BRANCH_BANK_ACCOUNT_INACTIVE("PM_103", "Tài khoản ngân hàng của chi nhánh đang tạm khoá."),

    // ==========================
    // Deposit payment (thu tien coc)
    // ==========================
    RESERVATION_NOT_FOUND("PM_201", "Không tìm thấy đơn đặt bàn."),
    DEPOSIT_ALREADY_EXISTS("PM_202", "Đơn đặt bàn này đã có lệnh thu cọc còn hiệu lực."),
    DEPOSIT_NOT_FOUND("PM_203", "Không tìm thấy lệnh thu cọc."),
    DEPOSIT_AMOUNT_INVALID("PM_204", "Số tiền cọc không hợp lệ."),
    DEPOSIT_ALREADY_PAID("PM_205", "Lệnh thu cọc đã được thanh toán, không thể huỷ."),
    DEPOSIT_CANNOT_CANCEL("PM_206", "Lệnh thu cọc ở trạng thái hiện tại không thể huỷ."),
    PAYOS_CREATE_PAYMENT_LINK_FAILED("PM_207", "Không thể tạo link thanh toán payOS."),
    PAYOS_SYNC_PAYMENT_FAILED("PM_208", "Không thể đồng bộ trạng thái thanh toán từ payOS."),
    PAYOS_CANCEL_PAYMENT_FAILED("PM_209", "Không thể huỷ link thanh toán trên payOS."),

    // ==========================
    // Refund bank info
    // ==========================
    REFUND_BANK_INFO_NOT_FOUND("PM_301", "Chưa có thông tin tài khoản nhận hoàn cọc cho đơn này."),
    REFUND_BANK_INFO_ALREADY_EXISTS("PM_302", "Đơn này đã có thông tin tài khoản nhận hoàn cọc."),

    // ==========================
    // Invoice payment (thanh toan hoa don cuoi buoi qua QR - khong persist)
    // ==========================
    INVOICE_PAYMENT_AMOUNT_INVALID("PM_322", "Số tiền hoá đơn không hợp lệ (phải lớn hơn 0)."),

    // ==========================
    // Payout order (chi hoan coc)
    // ==========================
    PAYOUT_ALREADY_EXISTS("PM_401", "Đơn đặt bàn này đã có lệnh chi hoàn cọc."),
    PAYOUT_NOT_FOUND("PM_402", "Không tìm thấy lệnh chi hoàn cọc."),
    PAYOS_CREATE_PAYOUT_FAILED("PM_403", "Không thể tạo lệnh chi hoàn cọc trên payOS."),
    PAYOS_SYNC_PAYOUT_FAILED("PM_404", "Không thể đồng bộ trạng thái lệnh chi từ payOS."),

    // ==========================
    // Webhook
    // ==========================
    WEBHOOK_SIGNATURE_INVALID("PM_501", "Chữ ký webhook không hợp lệ."),
    WEBHOOK_PAYLOAD_INVALID("PM_502", "Payload webhook không hợp lệ."),
    WEBHOOK_DEPOSIT_NOT_MATCHED("PM_503", "Không tìm thấy lệnh thu cọc tương ứng với orderCode trong webhook."),

    // ==========================
    // payOS client / config chung
    // ==========================
    PAYOS_CONFIG_MISSING("PM_601", "Chi nhánh chưa cấu hình đầy đủ client-id/api-key/checksum-key payOS."),
    PAYOS_CALL_ERROR("PM_602", "Lỗi khi gọi payOS API."),
    ENCRYPTION_ERROR("PM_603", "Lỗi khi mã hoá/giải mã dữ liệu nhạy cảm.");

    private final String code;
    private final String message;
}