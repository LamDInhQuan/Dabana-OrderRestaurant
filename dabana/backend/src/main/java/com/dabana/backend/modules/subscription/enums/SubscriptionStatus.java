package com.dabana.backend.modules.subscription.enums;

/**
 * PENDING_PAYMENT: vua dang ky lan dau, cho xac nhan thanh toan hoa don INITIAL,
 * chua tinh la 1 ky subscribe hop le (khong dung de kiem tra han muc chi nhanh).
 */
public enum SubscriptionStatus {
    PENDING_PAYMENT,
    ACTIVE,
    PAST_DUE,
    EXPIRED,
    CANCELLED
}
