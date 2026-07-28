package com.dabana.backend.modules.review;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.branch2.entity.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

/**
 * B13: Danh gia va xep hang chi nhanh sau khi don hoan tat.
 * BR01: chi don o trang thai COMPLETED moi duoc danh gia.
 * Diem trung binh duoc tinh lai va cap nhat vao Branch moi khi co danh gia moi.
 */
@Getter
@Setter
@Entity
@Table(name = "rv_reviews", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"booking_id"}) // moi don chi duoc danh gia 1 lan
})
public class Review extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer spaceRating;    // khong gian

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer serviceRating;  // phuc vu

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer foodRating;     // do an

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(columnDefinition = "TEXT")
    private String content;         // Khớp với cột content trong DB

    @Column(name = "restaurant_reply", columnDefinition = "TEXT")
    private String restaurantReply; // Khớp với cột restaurant_reply trong DB (Dùng cho nhà hàng phản hồi)

    @Column(nullable = false)
    private Integer status = 1;     // Khớp với cột status trong DB (Mặc định = 1)

    /** F41: Quan tri vien kiem duyet, an danh gia ao/vi pham thay vi xoa cung. */
    @Column(nullable = false)
    private Boolean hidden = false;

    /** F41/F42: ly do bi an (khi quan tri vien kiem duyet) hoac bi bao cao. */
    @Column(length = 500)
    private String moderationNote;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer rating;
}