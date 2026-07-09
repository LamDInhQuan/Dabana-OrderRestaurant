package com.dabana.backend.modules.menu.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.menu.dto.request.*;
import com.dabana.backend.modules.menu.dto.response.MenuCategoryResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemImageResponse;
import com.dabana.backend.modules.menu.dto.response.MenuItemResponse;
import com.dabana.backend.modules.menu.entity.MenuCategory;
import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.entity.MenuItemImage;
import com.dabana.backend.modules.menu.mapper.MenuMapper;
import com.dabana.backend.modules.menu.repository.MenuCategoryRepository;
import com.dabana.backend.modules.menu.repository.MenuItemImageRepository;
import com.dabana.backend.modules.menu.repository.MenuItemRepository;
import com.dabana.backend.modules.menu.util.MenuErrorCode;
import com.dabana.backend.modules.menu.util.MenuItemStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService implements IMenuService {

    private final com.dabana.backend.modules.branch2.repository.BranchRepository branchRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final MenuItemImageRepository imageRepository;
    private final MenuMapper menuMapper;

    @Override
    @Transactional(readOnly = true)
    public List<MenuCategoryResponse> getMenuByBranch(Long branchId) {
        validateBranch(branchId);
        List<MenuCategoryResponse> responses = new ArrayList<>();
        for (MenuCategory category : categoryRepository.findByBranchIdOrderByDisplayOrderAscIdAsc(branchId)) {
            responses.add(buildCategoryResponse(category, true));
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuCategoryResponse> getCategoriesByBranch(Long branchId) {
        validateBranch(branchId);
        List<MenuCategoryResponse> responses = new ArrayList<>();
        for (MenuCategory category : categoryRepository.findByBranchIdOrderByDisplayOrderAscIdAsc(branchId)) {
            responses.add(buildCategoryResponse(category, false));
        }
        return responses;
    }

    @Override
    @Transactional
    public MenuCategoryResponse createCategory(CreateMenuCategoryRequest request) {
        Branch branch = validateBranch(request.getBranchId());
        ensureCategoryNameAvailable(branch.getId(), request.getCategoryName(), null);

        MenuCategory category = new MenuCategory();
        category.setBranch(branch);
        category.setCategoryName(request.getCategoryName().trim());
        category.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        return menuMapper.toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public MenuCategoryResponse updateCategory(Long categoryId, UpdateMenuCategoryRequest request) {
        MenuCategory category = getCategory(categoryId);
        ensureCategoryNameAvailable(category.getBranch().getId(), request.getCategoryName(), category.getId());

        category.setCategoryName(request.getCategoryName().trim());
        category.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        return menuMapper.toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId) {
        categoryRepository.delete(getCategory(categoryId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getItemsByCategory(Long categoryId) {
        getCategory(categoryId);
        List<MenuItemResponse> responses = new ArrayList<>();
        for (MenuItem item : itemRepository.findByCategoryIdOrderByIdAsc(categoryId)) {
            responses.add(buildItemResponse(item, true));
        }
        return responses;
    }

    @Override
    @Transactional
    public MenuItemResponse createItem(CreateMenuItemRequest request) {
        MenuCategory category = getCategory(request.getCategoryId());
        ensureItemNameAvailable(category.getId(), request.getItemName(), null);

        MenuItem item = new MenuItem();
        item.setCategory(category);
        applyItemRequest(item, request.getItemName(), request.getDescription(), request.getPrice(), request.getImageUrl(), request.getStatus());
        return buildItemResponse(itemRepository.save(item), true);
    }

    @Override
    @Transactional
    public MenuItemResponse updateItem(Long itemId, UpdateMenuItemRequest request) {
        MenuItem item = getItem(itemId);
        MenuCategory targetCategory = getCategory(request.getCategoryId());
        ensureItemNameAvailable(targetCategory.getId(), request.getItemName(), item.getId());

        item.setCategory(targetCategory);
        applyItemRequest(item, request.getItemName(), request.getDescription(), request.getPrice(), request.getImageUrl(), request.getStatus());
        return buildItemResponse(itemRepository.save(item), true);
    }

    @Override
    @Transactional
    public MenuItemResponse updateItemStatus(Long itemId, UpdateMenuItemStatusRequest request) {
        MenuItem item = getItem(itemId);
        item.setStatus(request.getStatus());
        return buildItemResponse(itemRepository.save(item), false);
    }

    @Override
    @Transactional
    public void deleteItem(Long itemId) {
        itemRepository.delete(getItem(itemId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemImageResponse> getImagesByItem(Long itemId) {
        getItem(itemId);
        return imageRepository.findByItemIdOrderByDisplayOrderAscIdAsc(itemId)
                .stream()
                .map(menuMapper::toImageResponse)
                .toList();
    }

    @Override
    @Transactional
    public MenuItemImageResponse addImage(CreateMenuItemImageRequest request) {
        MenuItem item = getItem(request.getItemId());
        MenuItemImage image = new MenuItemImage();
        image.setItem(item);
        image.setImageUrl(request.getImageUrl().trim());
        image.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        return menuMapper.toImageResponse(imageRepository.save(image));
    }

    @Override
    @Transactional
    public MenuItemImageResponse updateImage(Long imageId, UpdateMenuItemImageRequest request) {
        MenuItemImage image = getImage(imageId);
        image.setImageUrl(request.getImageUrl().trim());
        image.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
        return menuMapper.toImageResponse(imageRepository.save(image));
    }

    @Override
    @Transactional
    public void deleteImage(Long imageId) {
        imageRepository.delete(getImage(imageId));
    }

    private com.dabana.backend.modules.branch2.entity.Branch validateBranch(Long branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(MenuErrorCode.BRANCH_NOT_FOUND));
    }

    private MenuCategory getCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(MenuErrorCode.CATEGORY_NOT_FOUND));
    }

    private MenuItem getItem(Long itemId) {
        return itemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(MenuErrorCode.MENU_ITEM_NOT_FOUND));
    }

    private MenuItemImage getImage(Long imageId) {
        return imageRepository.findById(imageId)
                .orElseThrow(() -> new BusinessException(MenuErrorCode.MENU_ITEM_IMAGE_NOT_FOUND));
    }

    private void ensureCategoryNameAvailable(Long branchId, String categoryName, Long currentCategoryId) {
        categoryRepository.findByBranchIdAndCategoryNameIgnoreCase(branchId, categoryName.trim())
                .filter(existing -> currentCategoryId == null || !existing.getId().equals(currentCategoryId))
                .ifPresent(existing -> { throw new BusinessException(MenuErrorCode.CATEGORY_ALREADY_EXISTS); });
    }

    private void ensureItemNameAvailable(Long categoryId, String itemName, Long currentItemId) {
        itemRepository.findByCategoryIdAndItemNameIgnoreCase(categoryId, itemName.trim())
                .filter(existing -> currentItemId == null || !existing.getId().equals(currentItemId))
                .ifPresent(existing -> { throw new BusinessException(MenuErrorCode.MENU_ITEM_ALREADY_EXISTS); });
    }

    private void applyItemRequest(MenuItem item,
                                  String itemName,
                                  String description,
                                  java.math.BigDecimal price,
                                  String imageUrl,
                                  MenuItemStatus status) {
        item.setItemName(itemName.trim());
        item.setDescription(description);
        item.setPrice(price);
        item.setImageUrl(imageUrl == null || imageUrl.isBlank() ? null : imageUrl.trim());
        item.setStatus(status == null ? MenuItemStatus.SELLING : status);
    }

    private MenuCategoryResponse buildCategoryResponse(MenuCategory category, boolean includeItems) {
        MenuCategoryResponse response = menuMapper.toCategoryResponse(category);
        if (!includeItems) {
            return response;
        }

        List<MenuItemResponse> itemResponses = new ArrayList<>();
        for (MenuItem item : itemRepository.findByCategoryIdOrderByIdAsc(category.getId())) {
            itemResponses.add(buildItemResponse(item, true));
        }
        menuMapper.attachItems(response, itemResponses);
        return response;
    }

    private MenuItemResponse buildItemResponse(MenuItem item, boolean includeImages) {
        MenuItemResponse response = menuMapper.toItemResponse(item);
        if (!includeImages) {
            return response;
        }
        menuMapper.attachImages(response, imageRepository.findByItemIdOrderByDisplayOrderAscIdAsc(item.getId()));
        return response;
    }
}