package com.dabana.backend.modules.restaurant;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.User;
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

    @OneToOne
    @JoinColumn(name = "owner_user_id", nullable = false, unique = true)
    private User owner; // tai khoan nha hang doi tac (UserRole.RESTAURANT_PARTNER)

    @NotBlank
    @Column(nullable = false, length = 200)
    private String brandName;

    @Column(length = 500)
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String cuisineType; // nganh am thuc chinh

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(length = 500)
    private String rejectionReason;

    // Snapshot ban cap nhat dang cho duyet (AF02 cua B03)
    @Column(length = 500)
    private String pendingLogoUrl;

    @Column(columnDefinition = "TEXT")
    private String pendingDescription;
}
