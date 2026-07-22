package com.dabana.backend.modules.orderboard.util;

/**
 * Nguon goc cua 1 dong mon trong danh sach Unified Order (gop tu 2 bang
 * rs_preorder_items va rs_extra_orders) tra ve cho Tab Goi Mon.
 */
public enum OrderSource {
    PREORDER,      // rs_preorder_items - mon khach dat truoc khi tao booking
    EXTRA_ORDER    // rs_extra_orders - mon goi them tai ban trong luc dung bua
}
