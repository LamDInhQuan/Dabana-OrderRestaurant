package com.dabana.backend.modules.subscription.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.subscription.enums.BillingCycle;
import com.dabana.backend.modules.subscription.enums.PlanStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * sub_plans - cau hinh goi dich vu. Day CHI la cau hinh hien hanh, KHONG duoc
 * tham chieu dong khi tinh hoa don hoac kiem tra han muc cua subscription dang
 * active - luon dung cac cot *_snapshot trong RestaurantSubscription/SubscriptionInvoice.
 */
@Getter
@Setter
@Entity
@Table(name = "sub_plans")
public class SubscriptionPlan extends BaseEntity {

    @Column(name = "plan_code", nullable = false, unique = true, length = 30)
    private String planCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false, length = 20)
    private BillingCycle billingCycle;

    @Column(name = "max_branches", nullable = false)
    private Integer maxBranches;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlanStatus status = PlanStatus.ACTIVE;
}
