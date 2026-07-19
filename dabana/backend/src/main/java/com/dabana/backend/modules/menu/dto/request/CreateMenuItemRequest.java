package com.dabana.backend.modules.menu.dto.request;

import com.dabana.backend.modules.menu.util.MenuItemStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateMenuItemRequest {
    @NotNull
    private Long categoryId;

    @NotBlank
    @Size(max = 150)
    private String itemName;

    private String description;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;

    @Size(max = 255)
    private String imageUrl;

    private MenuItemStatus status = MenuItemStatus.SELLING;

    private Integer displayOrder = 0;
}