package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.AssignBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyResponse;

import java.util.List;

public interface IBranchPolicyService {
    BranchPolicyResponse create(
            Long branchId,
            AssignBranchPolicyRequest request
    );

    BranchPolicyResponse update(
            Long branchId,
            Long policyId,
            UpdateBranchPolicyRequest request
    );

    void delete(
            Long branchId,
            Long policyId
    );

    BranchPolicyDetailResponse getDetail(
            Long branchId,
            Long policyId
    );

    List<BranchPolicyResponse> getAll(
            Long branchId
    );
}
