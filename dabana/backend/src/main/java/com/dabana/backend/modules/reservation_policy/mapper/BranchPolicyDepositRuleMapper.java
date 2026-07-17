package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDepositRuleResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import org.springframework.stereotype.Component;

@Component
public class BranchPolicyDepositRuleMapper {

    public BranchPolicyDepositRule toEntity(CreateBranchPolicyDepositRuleRequest request, BranchPolicy branchPolicy) {
        return BranchPolicyDepositRule.builder()
                .branchPolicy(branchPolicy)
                .minGuest(request.getMinGuest())
                .maxGuest(request.getMaxGuest())
                .depositType(request.getDepositType())
                .depositValue(request.getDepositValue())
                .build();
    }

    public BranchPolicyDepositRuleResponse toResponse(BranchPolicyDepositRule entity) {
        return BranchPolicyDepositRuleResponse.builder()
                .id(entity.getId())
                .branchPolicyId(entity.getBranchPolicy().getId())
                .minGuest(entity.getMinGuest())
                .maxGuest(entity.getMaxGuest())
                .depositType(entity.getDepositType())
                .depositValue(entity.getDepositValue())
                .build();
    }
}
