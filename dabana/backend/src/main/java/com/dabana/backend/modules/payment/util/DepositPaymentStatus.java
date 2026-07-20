package com.dabana.backend.modules.payment.util;

/**
 * Trang thai lenh thu tien coc, dong bo qua GET /v2/payment-requests/{id}
 * va webhook payOS. Khop voi enum cot `status` cua bang pm_deposit_payments.
 */
public enum DepositPaymentStatus {
    PENDING,      // Vua tao link, cho khach thanh toan
    PROCESSING,   // payOS dang ghi nhan giao dich (truong hop thanh toan 1 phan)
    PAID,         // Da thanh toan du
    CANCELLED,    // Bi huy (het gio giu ban, khach huy, nhan vien huy...)
    EXPIRED       // Qua han ma khong thanh toan
}