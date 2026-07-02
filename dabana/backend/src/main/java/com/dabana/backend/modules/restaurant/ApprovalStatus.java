package com.dabana.backend.modules.restaurant;

/**
 * Trang thai duyet noi dung cong khai - dung chung cho Restaurant (B03)
 * va Branch (B04).
 */
public enum ApprovalStatus {
    PENDING,            // Cho duyet
    PENDING_UPDATE,      // Cho duyet ban cap nhat (AF02 cua B03/B04)
    APPROVED,           // Da duyet
    REJECTED            // Bi tu choi
}
