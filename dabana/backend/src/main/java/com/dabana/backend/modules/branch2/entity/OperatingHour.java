package com.dabana.backend.modules.branch2.entity;
import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.util.OperatingDay;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "rt_branch_operating_hours")
@Getter
@Setter
public class OperatingHour extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 20)
    private OperatingDay dayOfWeek;

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;

    @Column(name = "shift_name", length = 100)
    private String shiftName;
}