package com.dabana.backend.modules.menu.entity;

import com.dabana.backend.modules.menu.util.MenuItemStatus;
import com.dabana.backend.modules.menu.util.MenuItemStatusConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "rt_menu_items", indexes = {
        @Index(name = "idx_menu_items_category_status", columnList = "category_id, status")
})

public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private MenuCategory category;

    @NotBlank
    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Gia phai lon hon 0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Convert(converter = MenuItemStatusConverter.class)
    @Column(nullable = false)
    private MenuItemStatus status = MenuItemStatus.SELLING;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<MenuItemImage> images = new ArrayList<>();
    // Luu y: day la displayOrder cua ANH (MenuItemImage), khac voi displayOrder cua MON o tren

    @Transient
    public String getName() {
        return itemName;
    }

    public void setName(String name) {
        this.itemName = name;
    }
}