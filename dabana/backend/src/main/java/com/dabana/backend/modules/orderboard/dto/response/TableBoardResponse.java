package com.dabana.backend.modules.orderboard.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 1 the ban tren Tab Goi Mon: ten ban, trang thai (code theo
 * DiningTableStatus), booking dang active (neu co) va don hang da gop.
 */
@Data
public class TableBoardResponse {

    private Long tableId;
    private String tableName;
    private Integer capacity;

    /** Code theo DiningTableStatus: 1=EMPTY, 2=RESERVED, 3=OCCUPIED, 4=CLEANING, 5=MAINTENANCE */
    private Integer status;

    /** null neu ban dang khong gan voi booking nao dang active */
    private ActiveBookingResponse activeBooking;

    /** Unified Order: gop tu rs_preorder_items + rs_extra_orders cua activeBooking (neu co) */
    private List<OrderItemResponse> orders = new ArrayList<>();

    /** Tong tien tam tinh = tong lineTotal cua toan bo orders (tinh live, khong lay estimated_total snapshot luc hold ban) */
    private BigDecimal estimatedTotal = BigDecimal.ZERO;
}
