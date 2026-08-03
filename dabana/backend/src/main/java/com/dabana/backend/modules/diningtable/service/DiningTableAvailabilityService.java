package com.dabana.backend.modules.diningtable.service;

import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.diningtable.dto.response.TableAvailabilityResponse;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.diningtable.util.TableAvailabilityStatus;
import com.dabana.backend.modules.zone.entity.Zone;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

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

        List<Object[]> conflictData = bookingRepository.findConflictTableStatusesInBooking(tableIds, reservationTime, CONFLICT_STATUSES);
        Map<Long, BookingStatus> tableConflictStatusMap = conflictData.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],         // dt.id
                        row -> (BookingStatus) row[1],  // b.status
                        // Hộp giải quyết xung đột nếu 1 bàn vô tình bị trùng 2 đơn cùng giờ (ưu tiên CONFIRMED)
                        (status1, status2) -> status1 == BookingStatus.CONFIRMED ? status1 : status2
                ));
        return tables.stream()
                .map(table -> {
                    TableAvailabilityStatus status;

                    // Check trạng thái vật lý trước (bảo trì, dọn dẹp)
                    if (table.getStatus() == DiningTableStatus.MAINTENANCE || table.getStatus() == DiningTableStatus.CLEANING) {
                        status = TableAvailabilityStatus.UNAVAILABLE;
                    }
                    // Check trạng thái theo đơn đặt lịch đang giữ/đặt bàn này
                    else if (tableConflictStatusMap.containsKey(table.getId())) {
                        BookingStatus bookingStatus = tableConflictStatusMap.get(table.getId());
                        if (bookingStatus == BookingStatus.HOLDING) {
                            status = TableAvailabilityStatus.HOLDING;
                        } else if (bookingStatus == BookingStatus.CONFIRMED) {
                            status = TableAvailabilityStatus.CONFIRMED;
                        } else {
                            status = TableAvailabilityStatus.AVAILABLE;
                        }
                    }
                    // Mặc định bàn trống sạch sẽ
                    else {
                        status = TableAvailabilityStatus.AVAILABLE;
                    }

                    return diningTableMapper.toAvailabilityResponse(table, status);
                })
                .toList();
    }


}
