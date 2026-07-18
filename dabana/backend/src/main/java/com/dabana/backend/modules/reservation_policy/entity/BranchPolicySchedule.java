package com.dabana.backend.modules.reservation_policy.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "rt_branch_policy_schedules")
public class BranchPolicySchedule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_policy_id", nullable = false)
    private BranchPolicy branchPolicy;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "date_from")
    private LocalDate dateFrom;

    @Column(name = "date_to")
    private LocalDate dateTo;

    @Column(name = "time_from")
    private LocalTime timeFrom;

    @Column(name = "time_to")
    private LocalTime timeTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyStatus status;
}