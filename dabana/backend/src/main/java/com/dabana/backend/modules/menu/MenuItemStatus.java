package com.dabana.backend.modules.menu;

/**
 * BR03 cua B06: khong xoa cung mon da tung duoc dat, chi cho phep
 * chuyen trang thai Ngung ban.
 */
public enum MenuItemStatus {
    SELLING,      // Dang ban
    OUT_OF_STOCK, // Tam het mon
    DISCONTINUED  // Ngung ban (thay the cho xoa cung - BR03)
}
