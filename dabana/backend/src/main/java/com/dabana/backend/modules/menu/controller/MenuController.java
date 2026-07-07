package com.dabana.backend.modules.menu.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.menu.dto.request.*;
import com.dabana.backend.modules.menu.dto.response.MenuCategoryResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemImageResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemResponse;
import com.dabana.backend.modules.menu.service.IMenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final IMenuService menuService;

    @GetMapping("/branches/{branchId}")
    public ResponseEntity<ApiResponse<List<MenuCategoryResponse>>> getMenuByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, menuService.getMenuByBranch(branchId)));
    }

    @GetMapping("/branches/{branchId}/categories")
    public ResponseEntity<ApiResponse<List<MenuCategoryResponse>>> getCategoriesByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, menuService.getCategoriesByBranch(branchId)));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<MenuCategoryResponse>> createCategory(@Valid @RequestBody CreateMenuCategoryRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, menuService.createCategory(request)));
    }

    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<ApiResponse<MenuCategoryResponse>> updateCategory(@PathVariable Long categoryId,
                                                                            @Valid @RequestBody UpdateMenuCategoryRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, menuService.updateCategory(categoryId, request)));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteCategory(@PathVariable Long categoryId) {
        menuService.deleteCategory(categoryId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }

    @GetMapping("/categories/{categoryId}/items")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getItemsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, menuService.getItemsByCategory(categoryId)));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createItem(@Valid @RequestBody CreateMenuItemRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, menuService.createItem(request)));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateItem(@PathVariable Long itemId,
                                                                    @Valid @RequestBody UpdateMenuItemRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, menuService.updateItem(itemId, request)));
    }

    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateItemStatus(@PathVariable Long itemId,
                                                                          @Valid @RequestBody UpdateMenuItemStatusRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, menuService.updateItemStatus(itemId, request)));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteItem(@PathVariable Long itemId) {
        menuService.deleteItem(itemId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }

    @GetMapping("/items/{itemId}/images")
    public ResponseEntity<ApiResponse<List<MenuItemImageResponse>>> getImagesByItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, menuService.getImagesByItem(itemId)));
    }

    @PostMapping("/images")
    public ResponseEntity<ApiResponse<MenuItemImageResponse>> addImage(@Valid @RequestBody CreateMenuItemImageRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, menuService.addImage(request)));
    }

    @PutMapping("/images/{imageId}")
    public ResponseEntity<ApiResponse<MenuItemImageResponse>> updateImage(@PathVariable Long imageId,
                                                                          @Valid @RequestBody UpdateMenuItemImageRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, menuService.updateImage(imageId, request)));
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteImage(@PathVariable Long imageId) {
        menuService.deleteImage(imageId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }
}