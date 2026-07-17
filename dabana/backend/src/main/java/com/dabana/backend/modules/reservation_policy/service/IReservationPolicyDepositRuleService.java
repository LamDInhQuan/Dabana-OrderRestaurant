package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDepositRuleResponse;

import java.util.List;

public interface IReservationPolicyDepositRuleService {

    ReservationPolicyDepositRuleResponse create(
            Long restaurantId,
            Long policyId,
            CreateReservationPolicyDepositRuleRequest request
    );

    ReservationPolicyDepositRuleResponse update(
            Long restaurantId,
            Long policyId,
            Long ruleId,
            UpdateReservationPolicyDepositRuleRequest request
    );

    void delete(Long restaurantId, Long policyId, Long ruleId);

    ReservationPolicyDepositRuleResponse getDetail(Long restaurantId, Long policyId, Long ruleId);

    List<ReservationPolicyDepositRuleResponse> getAll(Long restaurantId, Long policyId);
}
