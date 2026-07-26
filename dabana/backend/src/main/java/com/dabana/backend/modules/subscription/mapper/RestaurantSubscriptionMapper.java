package com.dabana.backend.modules.subscription.mapper;

import com.dabana.backend.modules.subscription.dto.response.RestaurantSubscriptionResponse;
import com.dabana.backend.modules.subscription.entity.RestaurantSubscription;
import org.springframework.stereotype.Component;

@Component
public class RestaurantSubscriptionMapper {

    public RestaurantSubscriptionResponse toResponse(RestaurantSubscription subscription) {
        if (subscription == null) return null;
        return RestaurantSubscriptionResponse.builder()
                .id(subscription.getId())
                .restaurantId(subscription.getRestaurant().getId())
                .planId(subscription.getPlan().getId())
                .planNameSnapshot(subscription.getPlanNameSnapshot())
                .priceSnapshot(subscription.getPriceSnapshot())
                .billingCycleSnapshot(subscription.getBillingCycleSnapshot())
                .maxBranchesSnapshot(subscription.getMaxBranchesSnapshot())
                .status(subscription.getStatus())
                .currentPeriodStart(subscription.getCurrentPeriodStart())
                .currentPeriodEnd(subscription.getCurrentPeriodEnd())
                .gracePeriodEnd(subscription.getGracePeriodEnd())
                .autoRenew(subscription.getAutoRenew())
                .pendingDowngradePlanName(
                        subscription.getPendingDowngradePlan() != null
                                ? subscription.getPendingDowngradePlan().getName()
                                : null
                )
                .build();
    }
}