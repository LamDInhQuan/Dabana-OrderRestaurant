package com.dabana.backend.modules.menu.repository;

import com.dabana.backend.modules.menu.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findByBranchIdOrderByDisplayOrderAscIdAsc(Long branchId);

    Optional<MenuCategory> findByBranchIdAndCategoryNameIgnoreCase(Long branchId, String categoryName);
}