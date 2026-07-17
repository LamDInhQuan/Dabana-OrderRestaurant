package com.dabana.backend.modules.branch2.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.util.BranchScheduleExceptionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Entity
@Table(name = "rt_branch_schedule_exceptions")
public class BranchScheduleException extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "exception_type", nullable = false)
    private BranchScheduleExceptionType exceptionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operating_hour_id")
    private OperatingHour operatingHour;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(length = 255)
    private String reason;

}