package com.dabana.backend.modules.menu.mapper;

import com.dabana.backend.modules.menu.dto.response.MenuCategoryResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemImageResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemResponse;
import com.dabana.backend.modules.menu.entity.MenuCategory;
import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.entity.MenuItemImage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class MenuMapper {

    public MenuCategoryResponse toCategoryResponse(MenuCategory category) {
        MenuCategoryResponse response = new MenuCategoryResponse();
        response.setId(category.getId());
        response.setBranchId(category.getBranch().getId());
        response.setCategoryName(category.getCategoryName());
        response.setDisplayOrder(category.getDisplayOrder());
        response.setItems(new ArrayList<>());
        return response;
    }

    public MenuItemResponse toItemResponse(MenuItem item) {
        MenuItemResponse response = new MenuItemResponse();
        response.setId(item.getId());
        response.setCategoryId(item.getCategory().getId());
        response.setItemName(item.getItemName());
        response.setDescription(item.getDescription());
        response.setPrice(item.getPrice());
        response.setImageUrl(item.getImageUrl());
        response.setStatus(item.getStatus());
        response.setImages(new ArrayList<>());
        return response;
    }

    public MenuItemImageResponse toImageResponse(MenuItemImage image) {
        MenuItemImageResponse response = new MenuItemImageResponse();
        response.setId(image.getId());
        response.setItemId(image.getItem().getId());
        response.setImageUrl(image.getImageUrl());
        response.setDisplayOrder(image.getDisplayOrder());
        return response;
    }

    public void attachImages(MenuItemResponse itemResponse, List<MenuItemImage> images) {
        itemResponse.setImages(images.stream().map(this::toImageResponse).toList());
    }

    public void attachItems(MenuCategoryResponse categoryResponse, List<MenuItemResponse> items) {
        categoryResponse.setItems(items);
    }
}