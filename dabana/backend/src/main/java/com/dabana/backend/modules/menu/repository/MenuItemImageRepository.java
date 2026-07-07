package com.dabana.backend.modules.menu.repository;

import com.dabana.backend.modules.menu.entity.MenuItemImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemImageRepository extends JpaRepository<MenuItemImage, Long> {
    List<MenuItemImage> findByItemIdOrderByDisplayOrderAscIdAsc(Long itemId);
}