package com.dabana.backend.modules.extraorder.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request sua so luong 1 dong mon goi them da ghi nhan.
 * Khong cho sua ten/gia - chi sua duoc quantity, xoa dong bang API delete
 * neu can bo han mot mon.
 */
@Data
public class UpdateExtraOrderQuantityRequest {

    @NotNull
    @Min(value = 1, message = "Số lượng món phải lớn hơn 0")
    private Integer quantity;
}
