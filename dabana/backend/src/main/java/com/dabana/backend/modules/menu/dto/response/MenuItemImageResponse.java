package com.dabana.backend.modules.menu.dto.response;

import lombok.Data;

@Data
public class MenuItemImageResponse {
    private Long id;
    private Long itemId;
    private String imageUrl;
    private Integer displayOrder;
}