package com.dabana.backend.modules.menu.dto.request;

import com.dabana.backend.modules.menu.util.MenuItemStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BulkUpdateItemStatusRequest {

    @NotEmpty(message = "Danh sach mon an khong duoc rong")
    private List<Long> itemIds;

    @NotNull
    private MenuItemStatus status;
}
