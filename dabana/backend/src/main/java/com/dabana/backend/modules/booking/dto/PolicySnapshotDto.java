package com.dabana.backend.modules.booking.dto;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class PolicySnapshotDto {
    private String policyDepositCode ;
    private String policyDepositName ;
    private String description;
    private String termsAndConditions;
    private PolicyScheduleType scheduleType;
    private Integer minGuest;
    private Integer maxGuest;
    private DepositType depositType;
    private BigDecimal depositValue;
    private Integer minTables ;
    private Integer maxTables;
    private Integer dayOfWeek;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private LocalTime timeFrom;
    private LocalTime timeTo;
    private Integer freeCancellationHours;
    private BigDecimal freeRefundPercent;
    private BigDecimal lateRefundPercent;
    private BigDecimal noShowRefundPercent;
}
