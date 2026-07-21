package com.dabana.backend.modules.extraorder.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request them 1 dong mon goi them (rs_extra_orders) cho booking dang
 * CHECKED_IN. Gia + ten mon se duoc Service snapshot lai theo thuc don
 * HIEN HANH tai thoi diem ghi nhan (khac voi preorder).
 */
@Data
public class AddExtraOrderRequest {

    @NotNull
    private Long bookingId;

    @NotNull
    private Long menuItemId;

    @NotNull
    @Min(value = 1, message = "Số lượng món phải lớn hơn 0")
    private Integer quantity;
}
