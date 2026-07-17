package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class BranchPolicyScheduleResponse {

    private Long id;

    private Long branchPolicyId;

    private String name;

    private String description;

    private LocalDateTime startDatetime;

    private LocalDateTime endDatetime;

    private Integer priority;

    private PolicyStatus status;
}
