package com.dabana.backend.modules.booking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response cho 1 dong mon dat truoc (rs_preorder_items).
 * Co chu y giu CUNG SHAPE voi ExtraOrderResponse (module extraorder) -
 * id, itemName, price, quantity, lineTotal, createdAt - vi OrderBoardService
 * da gop 2 loai nay thanh Unified Order (OrderItemResponse) cho Tab Goi mon;
 * giu doi xung o day giup FE viet 1 bo UI dung chung de sua/xoa ca 2.
 */
@Data
@Builder
public class PreorderItemResponse {

    private Long id;

    private Long bookingId;

    private Long menuItemId;

    /** Ten mon tai thoi diem dat ban (snapshot, khong doi khi thuc don thay doi sau do) */
    private String itemName;

    /** Gia mon tai thoi diem dat ban */
    private BigDecimal price;

    private Integer quantity;

    /** price * quantity - tinh san cho FE, tranh phai tinh lai o client */
    private BigDecimal lineTotal;

    private Boolean walkIn;

    private LocalDateTime createdAt;
}