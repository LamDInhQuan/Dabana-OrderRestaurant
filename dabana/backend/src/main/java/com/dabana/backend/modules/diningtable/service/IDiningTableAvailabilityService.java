package com.dabana.backend.modules.diningtable.service;

import com.dabana.backend.modules.diningtable.dto.response.TableAvailabilityResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface IDiningTableAvailabilityService {
    List<TableAvailabilityResponse> getAvailability(
            Long branchId,
            Long zoneId,
            LocalDateTime reservationTime
    );
}
