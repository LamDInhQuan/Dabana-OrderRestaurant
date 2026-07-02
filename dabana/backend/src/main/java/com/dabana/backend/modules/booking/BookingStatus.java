package com.dabana.backend.modules.booking;

/**
 * Vong doi mot don dat ban, xuyen suot B01 (tao), B08 (lien ket trang thai
 * ban), B11 (huy/no-show) va B12 (hoan tat).
 */
public enum BookingStatus {
    HOLDING,             // Dang giu ban tam thoi, cho thanh toan (B01 buoc 7)
    AWAITING_PAYMENT,    // Da tao yeu cau thanh toan, cho ket qua cong (B01 buoc 8)
    CONFIRMED,           // Da xac nhan (B01 buoc 9)
    PENDING_NO_SHOW,      // Canh bao nghi ngo no-show, cho nhan vien xac nhan (B11 buoc 5)
    NO_SHOW,             // Da chot no-show (B11 buoc 7)
    CHECKED_IN,          // Da nhan ban, dang phuc vu (B12 buoc 1)
    COMPLETED,           // Hoan tat (B12 buoc 4-5)
    CANCELLED_BY_CUSTOMER,
    CANCELLED_BY_RESTAURANT,
    EXPIRED              // Het thoi gian giu ban ma chua thanh toan (B01 EF04)
}
