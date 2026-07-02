package com.dabana.backend.modules.table_layout;

/**
 * B08 Buoc 1: cac trang thai van hanh cua ban. BR01: mot ban chi co
 * duy nhat mot trang thai hop le tai mot thoi diem. MAINTENANCE co
 * do uu tien cao nhat (BR02 cua B08).
 */
public enum TableStatus {
    AVAILABLE,      // Trong
    RESERVED,       // Da dat (giu cho tam/khoa co dinh)
    OCCUPIED,       // Dang phuc vu
    CLEANING,       // Dang don dep
    HELD_FOR_WAITLIST, // Dang giu cho hang cho (B10 buoc 3)
    MAINTENANCE     // Bao tri - uu tien cao nhat, chan moi cap nhat khac
}
