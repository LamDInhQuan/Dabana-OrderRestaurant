package com.dabana.backend.modules.payment.util;

/**
 * Trang thai giao dich chi (data.transactions[0].state) tra ve tu payOS
 * khi tao lenh chi don qua POST /v1/payouts. Khop voi cot `state` cua
 * bang pm_payout_orders.
 */
public enum PayoutState {
    PROCESSING,
    SUCCEEDED,
    FAILED,
    CANCELLED
}