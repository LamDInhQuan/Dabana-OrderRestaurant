package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class BranchPolicyDetailResponse {

    private Long id;

    private Long branchId;

    private PolicyStatus status;

    private ReservationPolicySummaryResponse policy;

    private List<BranchPolicyDepositRuleResponse> depositRules;

    private List<BranchPolicyScheduleResponse> schedules;

}