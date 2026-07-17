package com.dabana.backend.modules.branch2.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Restaurant;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * B04: Chi nhanh thuoc mot nha hang doi tac. Moi chi nhanh co thuc don (B06),
 * so do (B07) va chinh sach dat ban (B05) rieng (BR01).
 *
 * Duoc tao lai o goi branch2 (thay cho goi branch cu da bi vo hieu hoa) vi day
 * la thuc the duoc rat nhieu module khac (booking, menu, waitlist, policy,
 * review, table_layout) tham chieu truc tiep toi.
 */
@Getter
@Setter
@Entity
@Table(name = "rt_branches")
public class Branch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank
    @Column(nullable = false, length = 500)
    private String address;

    private Double latitude;
    private Double longitude;

    @Column(length = 500)
    private String coverImageUrl;

    @Column(columnDefinition = "TEXT")
    private String shortDescription;

    /** B04 Buoc 4: trang thai duyet ho so chi nhanh boi Quan tri vien (F43). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    /** BR02: chi ACTIVE + APPROVED moi hien thi trong tim kiem (B01 buoc 1). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BranchOperatingStatus operatingStatus = BranchOperatingStatus.ACTIVE;

    @Column(length = 500)
    private String rejectionReason;

    // Khung gio hoat dong - luu dang JSON don gian: {"mon":"08:00-22:00", ...}
    @Column(columnDefinition = "TEXT")
    private String operatingHoursJson;
}
