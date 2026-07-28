package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDepositRuleResponse;

import java.util.List;

public interface IBranchPolicyDepositRuleService {

    BranchPolicyDepositRuleResponse create(
            Long branchId,
            Long branchPolicyId,
            CreateBranchPolicyDepositRuleRequest request
    );

    BranchPolicyDepositRuleResponse update(
            Long branchId,
            Long branchPolicyId,
            Long ruleId,
            UpdateBranchPolicyDepositRuleRequest request
    );

    void delete(Long branchId, Long branchPolicyId, Long ruleId);

    BranchPolicyDepositRuleResponse getDetail(Long branchId, Long branchPolicyId, Long ruleId);

    List<BranchPolicyDepositRuleResponse> getAll(Long branchId, Long policyId);
}
