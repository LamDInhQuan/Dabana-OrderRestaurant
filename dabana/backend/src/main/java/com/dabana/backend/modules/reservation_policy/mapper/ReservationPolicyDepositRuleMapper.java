package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDepositRuleResponse;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicyDepositRule;
import org.springframework.stereotype.Component;

@Component
public class ReservationPolicyDepositRuleMapper {

    public ReservationPolicyDepositRule toEntity(CreateReservationPolicyDepositRuleRequest request, ReservationPolicy policy) {
        return ReservationPolicyDepositRule.builder()
                .policy(policy)
                .minGuest(request.getMinGuests())
                .maxGuest(request.getMaxGuests())
                .depositType(request.getDepositType())
                .depositValue(request.getDepositValue())
                .maxTables(request.getMaxTables())
                .maxCapacitySlop(request.getMaxCapacitySlop())
                .minPreorderAmount(request.getMinPreorderAmount())
                .preorderDepositPercent(request.getPreorderDepositPercent())
                .build();
    }

    public ReservationPolicyDepositRuleResponse toResponse(ReservationPolicyDepositRule entity) {
        return ReservationPolicyDepositRuleResponse.builder()
                .id(entity.getId())
                .policyId(entity.getPolicy().getId())
                .minGuest(entity.getMinGuest())
                .maxGuest(entity.getMaxGuest())
                .depositType(entity.getDepositType())
                .depositValue(entity.getDepositValue())
                .maxTables(entity.getMaxTables())
                .maxCapacitySlop(entity.getMaxCapacitySlop())
                .minPreorderAmount(entity.getMinPreorderAmount())
                .preorderDepositPercent(entity.getPreorderDepositPercent())
                .build();
    }
}
