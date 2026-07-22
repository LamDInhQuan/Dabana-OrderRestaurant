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
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableStatusRequest;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableErrorCode;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.orderboard.event.TableBoardChangedEvent;
import com.dabana.backend.modules.zone.entity.FloorPlan;
import com.dabana.backend.modules.zone.entity.Zone;
import com.dabana.backend.modules.zone.repository.ZoneRepository;
import com.dabana.backend.modules.zone.service.FloorPlanSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class DiningTableService implements IDiningTableService {

    private static final double MIN_DISTANCE = 15.0;

    // BR (muc 3): nhan vien chi duoc phep chuyen thu cong ban giua 3 trang thai
    // nay tren UI Tab Goi mon. RESERVED/OCCUPIED do Backend tu dong dong bo theo
    // vong doi Booking (xem updateStatusForBooking + BookingService), khong duoc
    // set thu cong o day de tranh lech du lieu.
    private static final List<DiningTableStatus> MANUALLY_ALLOWED_STATUSES = List.of(
            DiningTableStatus.EMPTY,
            DiningTableStatus.CLEANING,
            DiningTableStatus.MAINTENANCE);

    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.PENDING_NO_SHOW);

    private final BranchRepository branchRepository;
    private final ZoneRepository zoneRepository;
    private final DiningTableRepository diningTableRepository;
    private final BookingRepository bookingRepository;
    private final DiningTableMapper diningTableMapper;
    private final FloorPlanSyncService floorPlanSyncService;
    // Task 5: publish event de OrderBoardWebSocketListener (module orderboard) broadcast
    // qua STOMP khi nhan vien doi trang thai ban thu cong (EMPTY/CLEANING/MAINTENANCE).
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<DiningTableResponse> getTablesByBranchAndZone(Long branchId, Long zoneId) {
        validateBranch(branchId);
        if (zoneId != null) {
            validateZone(zoneId);
            if (!zoneRepository.findById(zoneId)
                    .orElseThrow(() -> new BusinessException(DiningTableErrorCode.ZONE_NOT_FOUND)).getBranch().getId()
                    .equals(branchId)) {
                throw new BusinessException(DiningTableErrorCode.ZONE_NOT_FOUND);
            }
            return diningTableRepository.findByZoneIdOrderByIdAsc(zoneId).stream()
                    .map(diningTableMapper::toResponse)
                    .toList();
        }

        return diningTableRepository.findByZoneBranchId(branchId).stream()
                .map(diningTableMapper::toResponse)
                .toList();
    }

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

        DiningTable savedTable = diningTableRepository.save(table);

        FloorPlan floorPlan = floorPlanSyncService.lockOrCreateFloorPlan(zone);
        floorPlanSyncService.upsertTableIntoLayout(floorPlan, savedTable, true);

        return diningTableMapper.toResponse(savedTable);
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

        Zone previousZone = table.getZone();
        boolean zoneChanged = previousZone == null || !previousZone.getId().equals(targetZone.getId());

        table.setZone(targetZone);
        table.setTableName(request.getTableName().trim());
        table.setCapacity(request.getCapacity());

        DiningTable savedTable = diningTableRepository.save(table);

        if (zoneChanged && previousZone != null) {
            FloorPlan previousFloorPlan = floorPlanSyncService.lockOrCreateFloorPlan(previousZone);
            floorPlanSyncService.removeTableFromLayout(previousFloorPlan, savedTable.getId());
        }

        FloorPlan targetFloorPlan = floorPlanSyncService.lockOrCreateFloorPlan(targetZone);
        floorPlanSyncService.upsertTableIntoLayout(targetFloorPlan, savedTable, true);

        return diningTableMapper.toResponse(savedTable);
    }

    @Override
    @Transactional
    public List<DiningTableResponse> bulkUpdatePositions(BulkUpdateDiningTablePositionsRequest request) {
        // TreeMap thay vi HashMap: dam bao thu tu lock tableId LUON co dinh, tang dan.
        // Neu 2 request bulkUpdatePositions cung luc dung tap tableId giao nhau, ca 2
        // se
        // lock theo cung 1 thu tu -> tranh deadlock giua cac transaction.
        Map<Long, DiningTablePositionItemRequest> requestByTableId = new TreeMap<>();
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

        // Lock FloorPlan cua tung zone lien quan, cung theo thu tu zoneId tang dan,
        // TRUOC
        // khi ghi bat ky JSON nao - tranh deadlock va tranh lost-update voi
        // createOrUpdateFloorPlan (ZoneService) dang chay song song tren cung zone.
        Map<Long, FloorPlan> floorPlanByZone = new TreeMap<>();
        for (DiningTable table : lockedTables) {
            Long zoneId = table.getZone().getId();
            floorPlanByZone.computeIfAbsent(zoneId, id -> floorPlanSyncService.lockOrCreateFloorPlan(table.getZone()));
        }

        List<DiningTableResponse> responses = new ArrayList<>();
        for (DiningTable table : lockedTables) {
            DiningTable savedTable = diningTableRepository.save(table);
            FloorPlan floorPlan = floorPlanByZone.get(table.getZone().getId());
            floorPlanSyncService.upsertTableIntoLayout(floorPlan, savedTable, false);
            responses.add(diningTableMapper.toResponse(savedTable));
        }
        return responses;
    }

    @Override
    @Transactional
    public void updateStatusForBooking(List<Long> tableIds, DiningTableStatus status) {
        if (tableIds == null || tableIds.isEmpty()) {
            return;
        }
        List<DiningTable> tables = diningTableRepository.findAllByIdForUpdate(tableIds);
        for (DiningTable table : tables) {
            table.setStatus(status);
        }
        diningTableRepository.saveAll(tables);
    }

    @Override
    @Transactional
    public DiningTableResponse updateStatusManually(Long tableId, UpdateDiningTableStatusRequest request) {
        DiningTableStatus targetStatus;
        try {
            targetStatus = DiningTableStatus.fromCode(request.getStatus());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(DiningTableErrorCode.TABLE_STATUS_INVALID);
        }

        // Chi cho phep dich la EMPTY / CLEANING / MAINTENANCE - RESERVED/OCCUPIED
        // la trang thai chi Backend duoc tu dong doi theo vong doi Booking.
        if (targetStatus == null || !MANUALLY_ALLOWED_STATUSES.contains(targetStatus)) {
            throw new BusinessException(DiningTableErrorCode.TABLE_STATUS_INVALID);
        }

        DiningTable table = diningTableRepository.findByIdForUpdate(tableId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.TABLE_NOT_FOUND));

        // Ban dang RESERVED/OCCUPIED thi khong cho doi tay - phai di qua cac hanh dong
        // vong doi cua Booking (check-in/check-out/no-show/cancel).
        if (table.getStatus() == DiningTableStatus.RESERVED) {
            throw new BusinessException(DiningTableErrorCode.TABLE_RESERVED);
        }
        if (table.getStatus() == DiningTableStatus.OCCUPIED) {
            throw new BusinessException(DiningTableErrorCode.TABLE_OCCUPIED);
        }

        table.setStatus(targetStatus);
        DiningTable savedTable = diningTableRepository.save(table);

        // Task 5: bao Tab Goi Mon realtime - listener se broadcast SAU KHI transaction
        // nay commit thanh cong.
        eventPublisher.publishEvent(new TableBoardChangedEvent(
                savedTable.getZone().getBranch().getId(), List.of(savedTable.getId())));

        return diningTableMapper.toResponse(savedTable);
    }

    @Override
    @Transactional
    public void deleteDiningTable(Long tableId) {
        DiningTable table = diningTableRepository.findByIdForUpdate(tableId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.TABLE_NOT_FOUND));

        enforceEditableStructure(table);
        ensureNoFutureBookings(table.getId());

        FloorPlan floorPlan = floorPlanSyncService.lockOrCreateFloorPlan(table.getZone());
        floorPlanSyncService.removeTableFromLayout(floorPlan, table.getId());

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
                .ifPresent(existing -> {
                    throw new BusinessException(DiningTableErrorCode.TABLE_ALREADY_EXISTS);
                });
    }

    private void enforceEditableStructure(DiningTable table) {
        if (table.getStatus() != DiningTableStatus.EMPTY) {
            throw new BusinessException(DiningTableErrorCode.TABLE_NOT_EMPTY);
        }
    }

    private void ensureNoFutureBookings(Long tableId) {
        // if (bookingRepository.existsFutureBookingsByTableId(tableId,
        // LocalDateTime.now(), ACTIVE_BOOKING_STATUSES)) {
        // throw new BusinessException(DiningTableErrorCode.TABLE_HAS_FUTURE_BOOKING);
        // }
    }

    private void validateNoOverlap(List<DiningTable> tables) {
        Map<Long, List<DiningTable>> tablesByZone = new TreeMap<>();
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