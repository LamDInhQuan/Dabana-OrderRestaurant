package com.dabana.backend.modules.diningtable.service;

import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.diningtable.dto.response.TableAvailabilityResponse;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.diningtable.util.TableAvailabilityStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DiningTableAvailabilityService implements IDiningTableAvailabilityService {
    private static final List<BookingStatus> CONFLICT_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED
    );

    private final DiningTableRepository diningTableRepository;
    private final BookingRepository bookingRepository;
    private final DiningTableMapper diningTableMapper;

    @Override
    public List<TableAvailabilityResponse> getAvailability(
            Long branchId, Long zoneId, LocalDateTime reservationTime) {

        List<DiningTable> tables = diningTableRepository.findByZoneBranchIdAndZoneId(branchId, zoneId);
        if (tables.isEmpty()) {
            return List.of();
        }
        List<Long> tableIds = tables.stream()
                .map(DiningTable::getId)
                .toList();

        Set<Long> conflictTableIds = new HashSet<>(
                bookingRepository.findConflictTableIdsInBooking(tableIds, reservationTime, CONFLICT_STATUSES)
        );

        return tables.stream()
                .map(table -> {
                    TableAvailabilityStatus status;
                    if (table.getStatus() == DiningTableStatus.MAINTENANCE || table.getStatus() == DiningTableStatus.CLEANING) {
                        status = TableAvailabilityStatus.UNAVAILABLE;
                    } else if (conflictTableIds.contains(table.getId())) {
                        status = TableAvailabilityStatus.BOOKED;
                    } else {
                        status = TableAvailabilityStatus.AVAILABLE;
                    }
                    return diningTableMapper.toAvailabilityResponse(table, status);
                })
                .toList();
    }
}
