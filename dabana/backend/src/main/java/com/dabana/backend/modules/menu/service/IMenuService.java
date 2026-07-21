package com.dabana.backend.modules.menu.service;

import com.dabana.backend.modules.menu.dto.request.*;
import com.dabana.backend.modules.menu.dto.response.MenuCategoryResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemImageResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemResponse;
import com.dabana.backend.modules.menu.dto.response.PageResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemStatsResponse;

import java.util.List;

public interface IMenuService {
    List<MenuCategoryResponse> getMenuByBranch(Long branchId);

    List<MenuCategoryResponse> getCategoriesByBranch(Long branchId);

    MenuCategoryResponse createCategory(CreateMenuCategoryRequest request);

    MenuCategoryResponse updateCategory(Long categoryId, UpdateMenuCategoryRequest request);

    void deleteCategory(Long categoryId);

    List<MenuItemResponse> getItemsByCategory(Long categoryId);

    MenuItemResponse createItem(CreateMenuItemRequest request);

    MenuItemResponse updateItem(Long itemId, UpdateMenuItemRequest request);

    MenuItemResponse updateItemStatus(Long itemId, UpdateMenuItemStatusRequest request);

    List<MenuItemResponse> bulkUpdateItemStatus(BulkUpdateItemStatusRequest request);

    PageResponse<MenuItemResponse> searchItems(MenuItemSearchRequest request);

    MenuItemStatsResponse getItemStats(Long branchId);

    void deleteItem(Long itemId);

    List<MenuItemImageResponse> getImagesByItem(Long itemId);

    MenuItemImageResponse addImage(CreateMenuItemImageRequest request);

    MenuItemImageResponse updateImage(Long imageId, UpdateMenuItemImageRequest request);

    void deleteImage(Long imageId);
}