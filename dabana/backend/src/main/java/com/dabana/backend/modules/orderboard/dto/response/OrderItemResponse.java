package com.dabana.backend.modules.orderboard.dto.response;

import com.dabana.backend.modules.orderboard.util.OrderSource;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 1 dong mon da duoc GOP tu rs_preorder_items + rs_extra_orders (Order
 * Aggregation Rule - muc 2 tai lieu yeu cau). FE hien thi chung 1 bang,
 * phan biet nguon qua truong "source" khi can (vd icon/tag khac nhau).
 */
@Data
public class OrderItemResponse {

    /** id goc trong rs_preorder_items hoac rs_extra_orders (khong dung chung 1 khong gian id) */
    private Long id;

    private OrderSource source;

    private Long menuItemId;

    private String itemName;

    private BigDecimal price;

    private Integer quantity;

    private BigDecimal lineTotal;

    /** Chi co gia tri voi PREORDER: true = mon duoc ghi la goi them tai quay (snapshot cu, xem BookingItem) */
    private Boolean walkIn;

    /** Chi co gia tri voi EXTRA_ORDER: nhan vien nao ghi nhan mon nay (recorded_by_user_id -> full_name) */
    private String recordedByName;

    private LocalDateTime createdAt;
}
