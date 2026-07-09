//package com.dabana.backend.modules.branch;
//
//import com.dabana.backend.common.BaseEntity;
//import com.dabana.backend.modules.restaurant.ApprovalStatus;
//import com.dabana.backend.modules.restaurant.Restaurant;
//import jakarta.persistence.*;
//import jakarta.validation.constraints.NotBlank;
//import lombok.Getter;
//import lombok.Setter;
//
///**
// * B04: Chi nhanh thuoc mot nha hang doi tac. Moi chi nhanh co thuc don (B06),
// * so do (B07) va chinh sach dat ban (B05) rieng (BR01).
// */
//@Getter
//@Setter
//@Entity
//@Table(name = "rt_branches")
//public class Branch extends BaseEntity {
//
//    @ManyToOne
//    @JoinColumn(name = "restaurant_id", nullable = false)
//    private Restaurant restaurant;
//
//    @NotBlank
//    @Column(nullable = false, length = 200)
//    private String name;
//
//    @NotBlank
//    @Column(nullable = false, length = 500)
//    private String address;
//
//    private Double latitude;
//    private Double longitude;
//
//    @Column(length = 500)
//    private String coverImageUrl;
//
//    @Column(columnDefinition = "TEXT")
//    private String shortDescription;
//
//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false, length = 30)
//    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING; // B04 buoc 4
//
//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false, length = 30)
//    private BranchOperatingStatus operatingStatus = BranchOperatingStatus.ACTIVE; // BR02 chi ACTIVE+APPROVED moi hien thi tim kiem
//
//    @Column(length = 500)
//    private String rejectionReason;
//
//    // Khung gio hoat dong - luu dang JSON don gian: {"mon":"08:00-22:00", ...}
//    @Column(columnDefinition = "TEXT")
//    private String operatingHoursJson;
//}
