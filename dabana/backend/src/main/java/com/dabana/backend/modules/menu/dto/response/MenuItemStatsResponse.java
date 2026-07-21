package com.dabana.backend.modules.menu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemStatsResponse {
    private long total;
    private long selling;
    private long outOfStock;
}