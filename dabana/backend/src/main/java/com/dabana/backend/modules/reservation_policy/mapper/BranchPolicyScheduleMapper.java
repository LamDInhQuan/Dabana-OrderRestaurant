package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyScheduleResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicySchedule;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import org.springframework.stereotype.Component;

@Component
public class BranchPolicyScheduleMapper {

    public BranchPolicySchedule toEntity(CreateBranchPolicyScheduleRequest request, BranchPolicy branchPolicy) {
        return BranchPolicySchedule.builder()
                .branchPolicy(branchPolicy)
                .dayOfWeek(request.getDayOfWeek())
                .dateFrom(request.getDateFrom())
                .dateTo(request.getDateTo())
                .timeFrom(request.getTimeFrom())
                .timeTo(request.getTimeTo())
                .status(PolicyStatus.ACTIVE)
                .build();
    }

    public BranchPolicyScheduleResponse toResponse(BranchPolicySchedule entity) {
        return BranchPolicyScheduleResponse.builder()
                .id(entity.getId())
                .branchPolicyId(entity.getBranchPolicy().getId())
                .dayOfWeek(entity.getDayOfWeek())
                .dateFrom(entity.getDateFrom())
                .dateTo(entity.getDateTo())
                .timeFrom(entity.getTimeFrom())
                .timeTo(entity.getTimeTo())
                .status(entity.getStatus())
                .build();
    }
}
