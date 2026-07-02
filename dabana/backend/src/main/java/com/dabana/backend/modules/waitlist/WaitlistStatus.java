package com.dabana.backend.modules.waitlist;

/**
 * Vong doi mot luot cho trong B10.
 */
public enum WaitlistStatus {
    WAITING,        // Dang cho
    INVITED,        // Da gui loi moi, cho phan hoi (han 10 phut - BR02)
    CONVERTED,      // Da chuyen thanh don dat ban chinh thuc
    EXPIRED,        // Het thoi han phan hoi loi moi (EF01)
    CANCELLED       // Khach tu huy
}
