package com.dabana.backend.modules.menu.dto.request;

import com.dabana.backend.modules.menu.util.MenuItemStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Tham so loc/tim kiem/phan trang cho danh sach mon an.
 * Duoc bind tu query string, vi du:
 * GET /api/menu/items/search?branchId=1&status=SELLING&keyword=ca&page=0&size=20
 * Tat ca field deu optional (null = khong loc theo tieu chi do).
 */
@Data
public class MenuItemSearchRequest {

    private Long categoryId;

    private Long branchId;

    private MenuItemStatus status;

    private String keyword;

    private BigDecimal priceMin;

    private BigDecimal priceMax;

    @Min(0)
    private int page = 0;

    @Min(1)
    @Max(100)
    private int size = 20;
}