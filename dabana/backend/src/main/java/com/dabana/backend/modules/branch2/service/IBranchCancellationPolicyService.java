package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.modules.branch2.dto.request.BranchCancellationPolicyRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchCancellationPolicyResponse;
import com.dabana.backend.modules.branch2.entity.BranchCancellationPolicy;

public interface IBranchCancellationPolicyService {

    BranchCancellationPolicyResponse create(
            Long branchId,
            BranchCancellationPolicyRequest request
    );

    BranchCancellationPolicyResponse update(
            Long branchId,
            BranchCancellationPolicyRequest request
    );

    BranchCancellationPolicyResponse getByBranch(
            Long branchId
    );

    BranchCancellationPolicy loadByBranch(
            Long branchId
    );
}