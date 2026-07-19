package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.modules.branch2.dto.OperatingPeriod;
import com.dabana.backend.modules.branch2.entity.BranchScheduleException;
import com.dabana.backend.modules.branch2.util.OperatingDay;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface IAvailableSlotService {
    List<OperatingPeriod> getEffectiveOperatingPeriods(
            Long branchId,
            LocalDate date) ;

    List<OperatingPeriod> loadOperatingHours(
            Long branchId,
            OperatingDay operatingDay) ;

    boolean isReservationTimeAvailable(
            Long branchId,
            LocalDateTime reservationTime
    );
}
