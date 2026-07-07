package com.dabana.backend.modules.menu;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.entity.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * B06: mon an thuoc thuc don rieng cua tung chi nhanh (BR01).
 * Gia/ten duoc dung de chot snapshot khi khach dat mon truoc (B01 buoc 5,
 * BR04 cua B06) - xem BookingItem trong module booking.
 */
@Getter
@Setter
@Entity
@Table(name = "rt_menu_items")
public class MenuItem extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private com.dabana.backend.modules.branch2.entity.Branch branch;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String category; // khai vi, mon chinh, do uong, trang mieng...

    @DecimalMin(value = "0.0", inclusive = false, message = "Gia phai lon hon 0 (EF02)")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(length = 500)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercent; // B06 buoc 4: uu dai theo mon (tuy chon)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MenuItemStatus status = MenuItemStatus.SELLING;
}
