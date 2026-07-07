package com.dabana.backend.modules.menu.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MenuCategoryResponse {
    private Long id;
    private Long branchId;
    private String categoryName;
    private Integer displayOrder;
    private List<MenuItemResponse> items = new ArrayList<>();
}