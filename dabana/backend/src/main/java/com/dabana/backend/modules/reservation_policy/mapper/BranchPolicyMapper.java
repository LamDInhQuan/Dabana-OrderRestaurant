package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.reservation_policy.dto.request.AssignBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicySummaryResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BranchPolicyMapper {

    private final BranchPolicyDepositRuleMapper depositRuleMapper;
    private final BranchPolicyScheduleMapper scheduleMapper;

    public BranchPolicy toEntity(AssignBranchPolicyRequest request, Branch branch, ReservationPolicy policy) {
        return BranchPolicy.builder()
                .branch(branch)
                .policy(policy)
                .status(PolicyStatus.ACTIVE)
                .build();
    }

    public BranchPolicyResponse toResponse(BranchPolicy branchPolicy) {

        return BranchPolicyResponse.builder()
                .id(branchPolicy.getId())
                .branchId(branchPolicy.getBranch().getId())
                .policyId(branchPolicy.getPolicy().getId())
                .policyCode(branchPolicy.getPolicy().getPolicyCode())
                .policyName(branchPolicy.getPolicy().getName())
                .status(branchPolicy.getStatus())
                .hasDepositOverride(!branchPolicy.getDepositRules().isEmpty())
                .hasScheduleOverride(!branchPolicy.getSchedules().isEmpty())
                .build();
    }

    public BranchPolicyDetailResponse toDetailResponse(BranchPolicy branchPolicy) {
        return BranchPolicyDetailResponse.builder()
                .id(branchPolicy.getId())
                .branchId(branchPolicy.getBranch().getId())
                .status(branchPolicy.getStatus())
                .policy(
                        ReservationPolicySummaryResponse.builder()
                                .id(branchPolicy.getPolicy().getId())
                                .policyCode(branchPolicy.getPolicy().getPolicyCode())
                                .name(branchPolicy.getPolicy().getName())
                                .description(branchPolicy.getPolicy().getDescription())
                                .build()
                )
                .depositRules(
                        branchPolicy.getDepositRules()
                                .stream()
                                .map(depositRuleMapper::toResponse)
                                .toList()
                )
                .schedules(
                        branchPolicy.getSchedules()
                                .stream()
                                .map(scheduleMapper::toResponse)
                                .toList()
                )

                .build();
    }

}
