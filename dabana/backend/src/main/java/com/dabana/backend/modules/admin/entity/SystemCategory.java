package com.dabana.backend.modules.admin.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * F45: Danh muc dung chung cua nen tang (loai mon an, khu vuc/tinh thanh,
 * tien ich...) do Quan tri vien cau hinh, dung lam du lieu tham chieu cho
 * cac nha hang doi tac khi tao ho so/thuc don (vi du: cuisineType, tien ich).
 */
@Getter
@Setter
@Entity
@Table(name = "rt_system_categories")
public class SystemCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nhom danh muc, vi du: CUISINE_TYPE, AMENITY, AREA... */
    @NotBlank
    @Column(name = "category_type", nullable = false, length = 50)
    private String categoryType;

    @NotBlank
    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;
}
