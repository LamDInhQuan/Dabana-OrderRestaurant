package com.dabana.backend.modules.restaurant.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.restaurant.ApprovalStatus;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * B03: Ho so thuong hieu nha hang doi tac (mot tai khoan doi tac
 * chi co mot ho so duy nhat - BR01).
 */
@Getter
@Setter
@Entity
@Table(name = "rt_restaurants")
public class Restaurant extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id", nullable = false, unique = true)
    private User owner;

    @NotBlank
    @Column(name = "restaurant_name", nullable = false, length = 155) // Fix length = 150 theo ảnh (để 155 hoặc 150 đều được)
    private String restaurantName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", nullable = false, length = 255) // Trong DB là Not Null [v] và varchar(255)
    private String logoUrl;

    @Column(length = 20) // Mới bổ sung theo DB
    private String phone;

    @Column(length = 150) // Mới bổ sung theo DB
    private String email;

    @Column(length = 255, unique = true) // Mới bổ sung theo DB (có tag UNI)
    private String website;

    @Column(name = "is_active", nullable = false) // Mới bổ sung theo DB (tinyint(4) mapping thành boolean)
    private boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 30) // Đổi tên cột từ status -> approval_status
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(length = 1000)
    private String cuisineType;

    @Column(length = 500)
    private String rejectionReason;

    @Column(length = 500)
    private String pendingLogoUrl;

    @Column(columnDefinition = "TEXT")
    private String pendingDescription;
}
