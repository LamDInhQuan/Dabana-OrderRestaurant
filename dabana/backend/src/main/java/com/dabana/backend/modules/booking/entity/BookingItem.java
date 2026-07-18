package com.dabana.backend.modules.booking.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.menu.entity.MenuItem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Mon an duoc dat truoc trong B01 buoc 5. Luu snapshot ten + gia tai
 * thoi diem khach hoan tat chon mon (BR04/BR09 cua B01, BR04 cua B06),
 * khong tham chieu dong den MenuItem hien hanh.
 */
@Getter
@Setter
@Entity
@Table(name = "rs_preorder_items")
public class BookingItem extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "menu_item_id")
    private com.dabana.backend.modules.menu.entity.MenuItem menuItem; // tham chieu de truy vet, KHONG dung de tinh gia

    // ===== Snapshot (BR04 cua B06 / BR09 cua B01) =====
    @Column(nullable = false, length = 200)
    private String snapshotName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal snapshotPrice;

    @Column(nullable = false)
    private Integer quantity = 1;

    private Boolean isWalkInOrder = false; // true = mon goi them tai quay (B12 buoc 2), gia dong theo thuc don hien hanh
}
