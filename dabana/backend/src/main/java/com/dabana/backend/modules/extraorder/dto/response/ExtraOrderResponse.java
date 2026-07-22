package com.dabana.backend.modules.extraorder.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response cho 1 dong mon goi them (rs_extra_orders).
 * Se duoc tai su dung o task 4 khi gop chung voi rs_preorder_items
 * thanh danh sach mon Unified Order tra ve cho Tab Goi mon.
 */
@Data
public class ExtraOrderResponse {

    private Long id;

    private Long bookingId;

    private Long menuItemId;

    /** Ten mon tai thoi diem ghi nhan (snapshot, khong doi khi thuc don thay doi sau do) */
    private String itemNameAtTime;

    /** Gia mon tai thoi diem ghi nhan */
    private BigDecimal priceAtTime;

    private Integer quantity;

    /** priceAtTime * quantity - tinh san cho FE, tranh phai tinh lai o client */
    private BigDecimal lineTotal;

    private Long recordedByUserId;

    private String recordedByName;

    private LocalDateTime createdAt;
}
