package com.dabana.backend.modules.menu.repository;

import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.util.MenuItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long>, JpaSpecificationExecutor<MenuItem> {

    List<MenuItem> findByCategoryIdOrderByDisplayOrderAscIdAsc(Long categoryId);

    List<MenuItem> findByCategoryIdAndStatus(Long categoryId, MenuItemStatus status);

    Optional<MenuItem> findByCategoryIdAndItemNameIgnoreCase(Long categoryId, String itemName);
}
