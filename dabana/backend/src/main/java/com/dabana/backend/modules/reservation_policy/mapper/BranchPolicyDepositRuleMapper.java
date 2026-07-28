package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDepositRuleResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import org.springframework.stereotype.Component;

@Component
public class BranchPolicyDepositRuleMapper {

    public BranchPolicyDepositRule toEntity(CreateBranchPolicyDepositRuleRequest request, BranchPolicy branchPolicy) {
        if (request == null) {
            return null;
        }

        return BranchPolicyDepositRule.builder()
                .branchPolicy(branchPolicy)
                .minGuest(request.getMinGuests())
                .maxGuest(request.getMaxGuests())
                .depositType(request.getDepositType())
                .depositValue(request.getDepositValue())
                .maxTables(request.getMaxTables())
                .maxCapacitySlop(request.getMaxCapacitySlop() != null ? request.getMaxCapacitySlop() : 2) // Default dung sai = 2 nếu null
                .minPreorderAmount(request.getMinPreorderAmount())
                .preorderDepositPercent(request.getPreorderDepositPercent())
                .build();
    }

    public BranchPolicyDepositRuleResponse toResponse(BranchPolicyDepositRule entity) {
        if (entity == null) {
            return null;
        }

        return BranchPolicyDepositRuleResponse.builder()
                .id(entity.getId())
                .branchPolicyId(entity.getBranchPolicy() != null ? entity.getBranchPolicy().getId() : null)
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
