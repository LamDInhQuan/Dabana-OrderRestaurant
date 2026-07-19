package com.dabana.backend.modules.menu.dto.response;

import com.dabana.backend.modules.menu.util.MenuItemStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class MenuItemResponse {
    private Long id;
    private Long categoryId;
    private String itemName;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private MenuItemStatus status;
    private Integer displayOrder;
    private List<MenuItemImageResponse> images = new ArrayList<>();
}