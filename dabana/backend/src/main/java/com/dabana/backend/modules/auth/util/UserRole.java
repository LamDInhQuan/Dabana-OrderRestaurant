package com.dabana.backend.modules.auth.util;

/**
 * Phan quyen RBAC theo dac ta: Khach hang, Nha hang doi tac, Quan tri vien.
 */
public enum UserRole {
    CUSTOMER,           // Khach hang
    RESTAURANT_PARTNER, // Nha hang doi tac
    ADMIN               // Quan tri vien
}
