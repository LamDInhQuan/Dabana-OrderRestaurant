package com.dabana.backend.modules.diningtable.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.diningtable.dto.request.BulkUpdateDiningTablePositionsRequest;
import com.dabana.backend.modules.diningtable.dto.request.CreateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.request.DiningTablePositionItemRequest;
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableErrorCode;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.zone.entity.Zone;
import com.dabana.backend.modules.zone.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiningTableService implements IDiningTableService {

    private static final double MIN_DISTANCE = 40.0;
    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.PENDING_NO_SHOW
    );

    private final BranchRepository branchRepository;
    private final ZoneRepository zoneRepository;
    private final DiningTableRepository diningTableRepository;
    private final BookingRepository bookingRepository;
    private final DiningTableMapper diningTableMapper;

    @Override
    @Transactional
    public DiningTableResponse createDiningTable(CreateDiningTableRequest request) {
        Zone zone = validateZone(request.getZoneId());
        ensureTableNameAvailable(zone.getId(), request.getTableName(), null);

        DiningTable table = new DiningTable();
        table.setZone(zone);
        table.setTableName(request.getTableName().trim());
        table.setCapacity(request.getCapacity());
        table.setPositionX(request.getPositionX());
        table.setPositionY(request.getPositionY());
        table.setStatus(DiningTableStatus.EMPTY);
        return diningTableMapper.toResponse(diningTableRepository.save(table));
    }

    @Override
    @Transactional
    public DiningTableResponse updateDiningTable(Long tableId, UpdateDiningTableRequest request) {
        DiningTable table = diningTableRepository.findByIdForUpdate(tableId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.TABLE_NOT_FOUND));

        enforceEditableStructure(table);
        ensureNoFutureBookings(table.getId());

        Zone targetZone = validateZone(request.getZoneId());
        ensureTableNameAvailable(targetZone.getId(), request.getTableName(), table.getId());

        table.setZone(targetZone);
        table.setTableName(request.getTableName().trim());
        table.setCapacity(request.getCapacity());
        return diningTableMapper.toResponse(diningTableRepository.save(table));
    }

    @Override
    @Transactional
    public List<DiningTableResponse> bulkUpdatePositions(BulkUpdateDiningTablePositionsRequest request) {
        Map<Long, DiningTablePositionItemRequest> requestByTableId = new HashMap<>();
        for (DiningTablePositionItemRequest item : request.getTables()) {
            if (requestByTableId.put(item.getTableId(), item) != null) {
                throw new BusinessException(DiningTableErrorCode.TABLE_OVERLAP);
            }
        }

        List<DiningTable> lockedTables = new ArrayList<>();
        for (Long tableId : requestByTableId.keySet()) {
            DiningTable table = diningTableRepository.findByIdForUpdate(tableId)
                    .orElseThrow(() -> new BusinessException(DiningTableErrorCode.TABLE_NOT_FOUND));
            enforceEditableStructure(table);
            ensureNoFutureBookings(table.getId());

            DiningTablePositionItemRequest item = requestByTableId.get(tableId);
            table.setPositionX(item.getPositionX());
            table.setPositionY(item.getPositionY());
            lockedTables.add(table);
        }

        validateNoOverlap(lockedTables);

        List<DiningTableResponse> responses = new ArrayList<>();
        for (DiningTable table : lockedTables) {
            responses.add(diningTableMapper.toResponse(diningTableRepository.save(table)));
        }
        return responses;
    }

    @Override
    @Transactional
    public void deleteDiningTable(Long tableId) {
        DiningTable table = diningTableRepository.findByIdForUpdate(tableId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.TABLE_NOT_FOUND));

        enforceEditableStructure(table);
        ensureNoFutureBookings(table.getId());
        diningTableRepository.delete(table);
    }

    private Zone validateZone(Long zoneId) {
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.ZONE_NOT_FOUND));
        validateBranch(zone.getBranch().getId());
        return zone;
    }

    private Branch validateBranch(Long branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.BRANCH_NOT_FOUND));
    }

    private void ensureTableNameAvailable(Long zoneId, String tableName, Long currentTableId) {
        diningTableRepository.findByZoneIdAndTableNameIgnoreCase(zoneId, tableName.trim())
                .filter(existing -> currentTableId == null || !existing.getId().equals(currentTableId))
                .ifPresent(existing -> { throw new BusinessException(DiningTableErrorCode.TABLE_ALREADY_EXISTS); });
    }

    private void enforceEditableStructure(DiningTable table) {
        if (table.getStatus() != DiningTableStatus.EMPTY) {
            throw new BusinessException(DiningTableErrorCode.TABLE_NOT_EMPTY);
        }
    }

    private void ensureNoFutureBookings(Long tableId) {
        if (bookingRepository.existsFutureBookingsByTableId(tableId, LocalDateTime.now(), ACTIVE_BOOKING_STATUSES)) {
            throw new BusinessException(DiningTableErrorCode.TABLE_HAS_FUTURE_BOOKING);
        }
    }

    private void validateNoOverlap(List<DiningTable> tables) {
        Map<Long, List<DiningTable>> tablesByZone = new HashMap<>();
        for (DiningTable table : tables) {
            tablesByZone.computeIfAbsent(table.getZone().getId(), key -> new ArrayList<>()).add(table);
        }

        for (Map.Entry<Long, List<DiningTable>> entry : tablesByZone.entrySet()) {
            Long zoneId = entry.getKey();
            List<DiningTable> zoneTables = new ArrayList<>(diningTableRepository.findByZoneIdOrderByIdAsc(zoneId));
            for (DiningTable updatedTable : entry.getValue()) {
                zoneTables.removeIf(existing -> existing.getId().equals(updatedTable.getId()));
                zoneTables.add(updatedTable);
            }

            for (int i = 0; i < zoneTables.size(); i++) {
                DiningTable left = zoneTables.get(i);
                if (left.getPositionX() == null || left.getPositionY() == null) {
                    continue;
                }
                for (int j = i + 1; j < zoneTables.size(); j++) {
                    DiningTable right = zoneTables.get(j);
                    if (right.getPositionX() == null || right.getPositionY() == null) {
                        continue;
                    }
                    double dx = left.getPositionX() - right.getPositionX();
                    double dy = left.getPositionY() - right.getPositionY();
                    double distance = Math.hypot(dx, dy);
                    if (distance < MIN_DISTANCE) {
                        throw new BusinessException(DiningTableErrorCode.TABLE_OVERLAP);
                    }
                }
            }
        }
    }
}