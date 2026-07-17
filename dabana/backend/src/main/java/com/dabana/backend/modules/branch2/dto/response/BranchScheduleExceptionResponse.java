package com.dabana.backend.modules.branch2.dto.response;

import com.dabana.backend.modules.branch2.util.BranchScheduleExceptionType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class BranchScheduleExceptionResponse {
    private Long id;

    private Long branchId;

    private LocalDate startDate;

    private LocalDate endDate;

    private BranchScheduleExceptionType exceptionType;

    private Long operatingHourId;

    private String operatingHourDisplay;

    private LocalTime openTime;

    private LocalTime closeTime;

    private String reason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
