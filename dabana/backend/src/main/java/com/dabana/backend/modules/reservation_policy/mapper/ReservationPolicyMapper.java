package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyResponse;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import com.dabana.backend.modules.restaurant.entity.Restaurant;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservationPolicyMapper {

    private final ReservationPolicyDepositRuleMapper depositRuleMapper;

    private final ReservationPolicyScheduleMapper scheduleMapper;

    public ReservationPolicy toEntity(CreateReservationPolicyRequest request, Restaurant restaurant) {
        return ReservationPolicy.builder()
                .restaurant(restaurant)
                .policyCode(request.getPolicyCode().trim())
                .name(request.getName().trim())
                .description(request.getDescription())
                .termsAndConditions(request.getTermsAndConditions())
                .isDefault(request.isDefault())
                .scheduleType(request.getPolicyScheduleType())
                .status(PolicyStatus.ACTIVE)
                .build();
    }

    public ReservationPolicyResponse toResponse(ReservationPolicy policy) {
        return ReservationPolicyResponse.builder()
                .id(policy.getId())
                .policyCode(policy.getPolicyCode())
                .name(policy.getName())
                .defaultPolicy(policy.getIsDefault())
                .policyScheduleType(policy.getScheduleType())
                .status(policy.getStatus())
                .build();
    }

    public ReservationPolicyDetailResponse toDetailResponse(ReservationPolicy policy) {

        return ReservationPolicyDetailResponse.builder()
                .id(policy.getId())
                .policyCode(policy.getPolicyCode())
                .name(policy.getName())
                .description(policy.getDescription())
                .termsAndConditions(policy.getTermsAndConditions())
                .defaultPolicy(policy.getIsDefault())
                .scheduleType(policy.getScheduleType())
                .status(policy.getStatus())
                .depositRules(
                        policy.getDepositRules()
                                .stream()
                                .map(depositRuleMapper::toResponse)
                                .toList()
                )
                .schedules(
                        policy.getSchedules()
                                .stream()
                                .map(scheduleMapper::toResponse)
                                .toList()
                )
                .build();
    }
}
