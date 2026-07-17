package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyScheduleResponse;

import java.util.List;

public interface IBranchPolicyScheduleService {

    BranchPolicyScheduleResponse create(
            Long branchId,
            Long policyId,
            CreateBranchPolicyScheduleRequest request
    );

    BranchPolicyScheduleResponse update(
            Long branchId,
            Long policyId,
            Long scheduleId,
            UpdateBranchPolicyScheduleRequest request
    );

    void delete(Long branchId, Long policyId, Long scheduleId);

    BranchPolicyScheduleResponse getDetail(Long branchId, Long policyId, Long scheduleId);

    List<BranchPolicyScheduleResponse> getAll(Long branchId, Long policyId);
}
