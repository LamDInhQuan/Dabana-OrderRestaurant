package com.dabana.backend.modules.subscription.dto.response;

import com.dabana.backend.modules.subscription.enums.BillingCycle;
import com.dabana.backend.modules.subscription.enums.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class RestaurantSubscriptionResponse {
    private Long id;
    private Long restaurantId;
    private Long planId;
    private String planNameSnapshot;
    private BigDecimal priceSnapshot;
    private BillingCycle billingCycleSnapshot;
    private Integer maxBranchesSnapshot;
    private SubscriptionStatus status;
    private LocalDate currentPeriodStart;
    private LocalDate currentPeriodEnd;
    private LocalDate gracePeriodEnd;
    private Boolean autoRenew;
    /** null neu khong co lich ha cap dang cho. */
    private String pendingDowngradePlanName;
}