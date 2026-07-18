package com.dabana.backend.modules.reservation_policy.dto.request;

import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class UpdateBranchPolicyScheduleRequest {

    private Integer dayOfWeek;

    private LocalDate dateFrom;

    private LocalDate dateTo;

    private LocalTime timeFrom;

    private LocalTime timeTo;

    private PolicyStatus status;
}
