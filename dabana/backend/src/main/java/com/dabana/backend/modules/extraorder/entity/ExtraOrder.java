package com.dabana.backend.modules.extraorder.entity;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.menu.entity.MenuItem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Mon goi them trong luc khach dang dung bua (B12 buoc 2), tach rieng khoi
 * rs_preorder_items (mon dat truoc luc dat ban). Luu snapshot ten + gia TAI
 * THOI DIEM nhan vien ghi nhan (gia dong theo thuc don hien hanh, khac voi
 * preorder la chot gia luc dat ban) va nguoi ghi nhan (recorded_by_user_id)
 * de doi soat khi can.
 *
 * Bang rs_extra_orders KHONG co cot updated_at nen entity nay khong ke thua
 * BaseEntity (tranh Hibernate co gang UPDATE mot cot khong ton tai).
 */
@Getter
@Setter
@Entity
@Table(name = "rs_extra_orders")
public class ExtraOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem; // tham chieu de truy vet, KHONG dung de tinh gia

    // ===== Snapshot tai thoi diem ghi nhan mon goi them =====
    @Column(name = "item_name_at_time", nullable = false, length = 150)
    private String itemNameAtTime;

    @Column(name = "price_at_time", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAtTime;

    @Column(nullable = false)
    private Integer quantity;

    // Nhan vien da tao/sua dong mon goi them nay gan nhat (BR muc 2 cua tab Goi mon)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_user_id", nullable = false)
    private User recordedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}