package com.dabana.backend.modules.subscription.mapper;

import com.dabana.backend.modules.subscription.dto.response.SubscriptionPlanResponse;
import com.dabana.backend.modules.subscription.entity.SubscriptionPlan;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionPlanMapper {

    public SubscriptionPlanResponse toResponse(SubscriptionPlan plan) {
        if (plan == null) return null;
        return SubscriptionPlanResponse.builder()
                .id(plan.getId())
                .planCode(plan.getPlanCode())
                .name(plan.getName())
                .price(plan.getPrice())
                .billingCycle(plan.getBillingCycle())
                .maxBranches(plan.getMaxBranches())
                .displayOrder(plan.getDisplayOrder())
                .description(plan.getDescription())
                .status(plan.getStatus())
                .build();
    }
}
