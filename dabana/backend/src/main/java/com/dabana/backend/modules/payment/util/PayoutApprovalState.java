package com.dabana.backend.modules.payment.util;

/**
 * Trang thai phe duyet lenh chi (data.approvalState) - ap dung khi tai khoan
 * payOS cua to chuc bat luong duyet nhieu buoc cho payout. Khop voi cot
 * `approval_state` cua bang pm_payout_orders.
 */
public enum PayoutApprovalState {
    PROCESSING,
    SUCCEEDED,
    REJECTED,
    FAILED
}