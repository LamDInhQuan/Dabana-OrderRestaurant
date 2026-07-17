package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyScheduleResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicySchedule;
import org.springframework.stereotype.Component;

@Component
public class BranchPolicyScheduleMapper {

    public BranchPolicySchedule toEntity(CreateBranchPolicyScheduleRequest request, BranchPolicy branchPolicy) {
        return BranchPolicySchedule.builder()
                .branchPolicy(branchPolicy)
                .name(request.getName().trim())
                .description(request.getDescription())
                .startDatetime(request.getStartDatetime())
                .endDatetime(request.getEndDatetime())
                .priority(request.getPriority())
                .status(request.getStatus())
                .build();
    }

    public BranchPolicyScheduleResponse toResponse(BranchPolicySchedule entity) {
        return BranchPolicyScheduleResponse.builder()
                .id(entity.getId())
                .branchPolicyId(entity.getBranchPolicy().getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .startDatetime(entity.getStartDatetime())
                .endDatetime(entity.getEndDatetime())
                .priority(entity.getPriority())
                .status(entity.getStatus())
                .build();
    }
}
