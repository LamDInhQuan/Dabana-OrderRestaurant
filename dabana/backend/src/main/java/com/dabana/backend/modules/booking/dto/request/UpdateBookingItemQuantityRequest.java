package com.dabana.backend.modules.booking.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request sua so luong 1 dong mon dat truoc (rs_preorder_items).
 * Khong cho sua ten/gia (giu nguyen snapshot luc dat ban) - chi sua duoc
 * quantity, xoa dong bang API delete neu can bo han mot mon.
 * Cung dang voi UpdateExtraOrderQuantityRequest (module extraorder) de
 * nhat quan giua 2 loai mon trong Unified Order.
 */
@Data
public class UpdateBookingItemQuantityRequest {

    @NotNull
    @Min(value = 1, message = "Số lượng món phải lớn hơn 0")
    private Integer quantity;
}