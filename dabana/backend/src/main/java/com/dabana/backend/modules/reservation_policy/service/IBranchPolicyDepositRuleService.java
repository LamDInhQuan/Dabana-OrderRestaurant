package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDepositRuleResponse;

import java.util.List;

public interface IBranchPolicyDepositRuleService {

    BranchPolicyDepositRuleResponse create(
            Long branchId,
            Long policyId,
            CreateBranchPolicyDepositRuleRequest request
    );

    BranchPolicyDepositRuleResponse update(
            Long branchId,
            Long policyId,
            Long ruleId,
            UpdateBranchPolicyDepositRuleRequest request
    );

    void delete(Long branchId, Long policyId, Long ruleId);

    BranchPolicyDepositRuleResponse getDetail(Long branchId, Long policyId, Long ruleId);

    List<BranchPolicyDepositRuleResponse> getAll(Long branchId, Long policyId);
}
