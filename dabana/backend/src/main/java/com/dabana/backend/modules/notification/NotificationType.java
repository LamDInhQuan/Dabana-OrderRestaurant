package com.dabana.backend.modules.notification;

public enum NotificationType {
    BOOKING_CONFIRMED,   // Tuc thi sau B01 buoc 9 (BR01 cua B09)
    BOOKING_REMINDER,    // 15-30 phut truoc gio an (B09 buoc 5)
    BOOKING_CANCELLED,   // B11
    NO_SHOW_WARNING,     // B11 buoc 5
    WAITLIST_INVITED,    // B10 buoc 4
    REVIEW_INVITATION,   // Sau B12 hoan tat
    PARTNER_APPROVED,    // B03/B04 duoc duyet
    PARTNER_REJECTED     // B03/B04 bi tu choi
}