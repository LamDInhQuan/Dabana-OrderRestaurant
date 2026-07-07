package com.dabana.backend.modules.menu.dto.request;

import com.dabana.backend.modules.menu.util.MenuItemStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateMenuItemStatusRequest {
    @NotNull
    private MenuItemStatus status;
}