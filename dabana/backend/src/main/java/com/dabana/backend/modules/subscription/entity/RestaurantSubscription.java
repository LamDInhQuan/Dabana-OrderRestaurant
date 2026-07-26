package com.dabana.backend.modules.subscription.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.subscription.enums.BillingCycle;
import com.dabana.backend.modules.subscription.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * sub_subscriptions - nguon su that DUY NHAT cho han muc/gia cua ky hien tai
 * (cac cot *Snapshot). KHONG doc lai SubscriptionPlan de lay han muc dang ap dung.
 */
@Getter
@Setter
@Entity
@Table(name = "sub_subscriptions")
public class RestaurantSubscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    /** Chi dung de hien thi/bao cao - KHONG dung de tinh han muc dang ap dung. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    /** Goi da dat lich ha cap, ap dung vao ky gia han ke tiep. Null = khong co lich cho. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pending_downgrade_plan_id")
    private SubscriptionPlan pendingDowngradePlan;

    @Column(name = "plan_name_snapshot", nullable = false, length = 100)
    private String planNameSnapshot;

    @Column(name = "price_snapshot", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle_snapshot", nullable = false, length = 20)
    private BillingCycle billingCycleSnapshot;

    @Column(name = "max_branches_snapshot", nullable = false)
    private Integer maxBranchesSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status = SubscriptionStatus.PENDING_PAYMENT;

    @Column(name = "current_period_start", nullable = false)
    private LocalDate currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private LocalDate currentPeriodEnd;

    /** Chi co gia tri khi status = PAST_DUE. */
    @Column(name = "grace_period_end")
    private LocalDate gracePeriodEnd;

    @Column(name = "auto_renew", nullable = false)
    private Boolean autoRenew = true;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;
}
