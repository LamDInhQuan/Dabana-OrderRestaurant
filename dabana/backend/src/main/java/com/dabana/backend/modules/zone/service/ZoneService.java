package com.dabana.backend.modules.zone.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.zone.dto.request.CreateZoneRequest;
import com.dabana.backend.modules.zone.dto.request.FloorPlanRequest;
import com.dabana.backend.modules.zone.dto.request.UpdateZoneRequest;
import com.dabana.backend.modules.zone.dto.response.FloorPlanResponse;
import com.dabana.backend.modules.zone.dto.response.ZoneResponse;
import com.dabana.backend.modules.zone.entity.FloorPlan;
import com.dabana.backend.modules.zone.entity.Zone;
import com.dabana.backend.modules.zone.mapper.FloorPlanMapper;
import com.dabana.backend.modules.zone.mapper.ZoneMapper;
import com.dabana.backend.modules.zone.repository.FloorPlanRepository;
import com.dabana.backend.modules.zone.repository.ZoneRepository;
import com.dabana.backend.modules.zone.util.ZoneErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ZoneService implements IZoneService {

    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.PENDING_NO_SHOW
    );

    private final BranchRepository branchRepository;
    private final ZoneRepository zoneRepository;
    private final FloorPlanRepository floorPlanRepository;
    private final DiningTableRepository diningTableRepository;
    private final BookingRepository bookingRepository;
    private final ZoneMapper zoneMapper;
    private final FloorPlanMapper floorPlanMapper;
    private final DiningTableMapper diningTableMapper;
    private final FloorPlanSyncService floorPlanSyncService;

    @Override
    @Transactional(readOnly = true)
    public List<ZoneResponse> getZonesByBranch(Long branchId) {
        validateBranch(branchId);
        return zoneRepository.findByBranchIdOrderByIdAsc(branchId).stream()
                .map(zone -> {
                    ZoneResponse response = zoneMapper.toResponse(zone);
                    response.setFloorPlan(floorPlanRepository.findByZoneId(zone.getId())
                            .map(floorPlanMapper::toResponse)
                            .orElse(null));
                    List<DiningTableResponse> tables = diningTableRepository.findByZoneIdOrderByIdAsc(zone.getId())
                            .stream()
                            .map(diningTableMapper::toResponse)
                            .toList();
                    response.setTables(tables);
                    return response;
                })
                .toList();
    }

    @Override
    @Transactional
    public ZoneResponse createZone(CreateZoneRequest request) {
        Branch branch = validateBranch(request.getBranchId());
        ensureZoneNameAvailable(branch.getId(), request.getZoneName(), null);

        Zone zone = new Zone();
        zone.setBranch(branch);
        zone.setZoneName(request.getZoneName().trim());
        zone.setDescription(normalizeText(request.getDescription()));

        Zone savedZone = zoneRepository.save(zone);
        FloorPlan savedFloorPlan = floorPlanSyncService.createEmptyFloorPlan(savedZone);

        ZoneResponse response = zoneMapper.toResponse(savedZone);
        response.setFloorPlan(floorPlanMapper.toResponse(savedFloorPlan));
        return response;
    }

    @Override
    @Transactional
    public ZoneResponse updateZone(Long zoneId, UpdateZoneRequest request) {
        Zone zone = getZone(zoneId);
        ensureZoneNameAvailable(zone.getBranch().getId(), request.getZoneName(), zone.getId());

        zone.setZoneName(request.getZoneName().trim());
        zone.setDescription(normalizeText(request.getDescription()));
        return zoneMapper.toResponse(zoneRepository.save(zone));
    }

    @Override
    @Transactional
    public void deleteZone(Long zoneId) {
        Zone zone = zoneRepository.findByIdForUpdate(zoneId)
                .orElseThrow(() -> new BusinessException(ZoneErrorCode.ZONE_NOT_FOUND));

        if (!diningTableRepository.findByZoneIdOrderByIdAsc(zoneId).isEmpty()) {
            throw new BusinessException(ZoneErrorCode.ZONE_HAS_TABLES);
        }

//        if (bookingRepository.existsFutureBookingsByZoneId(zoneId, LocalDateTime.now(), ACTIVE_BOOKING_STATUSES)) {
//            throw new BusinessException(ZoneErrorCode.ZONE_HAS_FUTURE_BOOKINGS);
//        }

        zoneRepository.delete(zone);
    }

    @Override
    @Transactional(readOnly = true)
    public FloorPlanResponse getFloorPlanByZone(Long zoneId) {
        getZone(zoneId);
        return floorPlanRepository.findByZoneId(zoneId)
                .map(floorPlanMapper::toResponse)
                .orElseThrow(() -> new BusinessException(ZoneErrorCode.FLOOR_PLAN_NOT_FOUND));
    }

    @Override
    @Transactional
    public FloorPlanResponse createOrUpdateFloorPlan(FloorPlanRequest request) {
        Zone zone = getZone(request.getZoneId());

        // Lock dong FloorPlan TRUOC, dam bao khong dan xen voi bulkUpdatePositions
        // (DiningTableService) hay 1 request createOrUpdateFloorPlan khac cung zone.
        FloorPlan floorPlan = floorPlanSyncService.lockOrCreateFloorPlan(zone);

        // layout_data la nguon goc: validate nghiem ngat + ghi de ca layout_data lan
        // position_x/y cua tung ban trong 1 buoc, dam bao khong bao gio lech nhau.
        floorPlanSyncService.applyFloorPlanRequest(zone, floorPlan, request.getLayoutData());

        return floorPlanMapper.toResponse(floorPlan);
    }

    @Override
    @Transactional
    public void deleteFloorPlan(Long zoneId) {
        getZone(zoneId);
        floorPlanRepository.findByZoneId(zoneId).ifPresent(floorPlanRepository::delete);
    }

    private Branch validateBranch(Long branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(ZoneErrorCode.BRANCH_NOT_FOUND));
    }

    private Zone getZone(Long zoneId) {
        return zoneRepository.findById(zoneId)
                .orElseThrow(() -> new BusinessException(ZoneErrorCode.ZONE_NOT_FOUND));
    }

    private void ensureZoneNameAvailable(Long branchId, String zoneName, Long currentZoneId) {
        zoneRepository.findByBranchIdAndZoneNameIgnoreCase(branchId, zoneName.trim())
                .filter(existing -> currentZoneId == null || !existing.getId().equals(currentZoneId))
                .ifPresent(existing -> { throw new BusinessException(ZoneErrorCode.ZONE_ALREADY_EXISTS); });
    }

    private String normalizeText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}