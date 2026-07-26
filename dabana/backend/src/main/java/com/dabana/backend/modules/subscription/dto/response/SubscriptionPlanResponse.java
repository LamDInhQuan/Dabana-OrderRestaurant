package com.dabana.backend.modules.subscription.dto.response;

import com.dabana.backend.modules.subscription.enums.BillingCycle;
import com.dabana.backend.modules.subscription.enums.PlanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class SubscriptionPlanResponse {
    private Long id;
    private String planCode;
    private String name;
    private BigDecimal price;
    private BillingCycle billingCycle;
    private Integer maxBranches;
    private Integer displayOrder;
    private String description;
    private PlanStatus status;
}
