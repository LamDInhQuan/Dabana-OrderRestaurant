package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
public class BranchPolicyScheduleResponse {

    private Long id;

    private Long branchPolicyId;

    private Integer dayOfWeek;

    private LocalDate dateFrom;

    private LocalDate dateTo;

    private LocalTime timeFrom;

    private LocalTime timeTo;

    private PolicyStatus status;
}
