package com.dabana.backend.modules.table_layout;

import com.dabana.backend.exception.BusinessException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * /api/zones, /api/tables - B07 (so do bo tri) va B08 (trang thai real-time).
 */
@RestController
@RequiredArgsConstructor
public class TableLayoutController {

    private final ZoneRepository zoneRepository;
    private final RestaurantTableRepository tableRepository;

    @Data
    public static class ZoneRequest {
        @NotBlank private String name;
        private String description;
        private Long branchId;
    }

    @Data
    public static class TableRequest {
        @NotBlank private String tableCode;
        private Integer capacity;
        private Double positionX;
        private Double positionY;
        private Long zoneId;
    }

    @Data
    public static class TableStatusUpdateRequest {
        private TableStatus status;
    }

    /** B07 Buoc 1: tao khu vuc phuc vu */
    @PostMapping("/api/zones")
    public ResponseEntity<Zone> createZone(@Valid @RequestBody ZoneRequest req) {
        // Trong trien khai day du: kiem tra branch thuoc dung nha hang dang dang nhap
        Zone zone = new Zone();
        zone.setName(req.getName());
        zone.setDescription(req.getDescription());
        return ResponseEntity.ok(zoneRepository.save(zone));
    }

    @GetMapping("/api/zones/branch/{branchId}")
    public ResponseEntity<List<Zone>> getZonesByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(zoneRepository.findByBranchIdAndActiveTrue(branchId));
    }

    /** B07 Buoc 3: khai bao ban tren so do (mac dinh trang thai Trong - BR06) */
    @PostMapping("/api/tables/manage")
    public ResponseEntity<RestaurantTable> createTable(@Valid @RequestBody TableRequest req) {
        Zone zone = zoneRepository.findById(req.getZoneId())
                .orElseThrow(() -> new BusinessException("ZONE_NOT_FOUND", "Khong tim thay khu vuc"));

        RestaurantTable table = new RestaurantTable();
        table.setZone(zone);
        table.setTableCode(req.getTableCode());
        table.setCapacity(req.getCapacity());
        table.setPositionX(req.getPositionX());
        table.setPositionY(req.getPositionY());
        table.setStatus(TableStatus.AVAILABLE); // BR06

        return ResponseEntity.ok(tableRepository.save(table));
    }

    @GetMapping("/api/tables/zone/{zoneId}")
    public ResponseEntity<List<RestaurantTable>> getTablesByZone(@PathVariable Long zoneId) {
        return ResponseEntity.ok(tableRepository.findByZoneId(zoneId));
    }

    /**
     * B08 Buoc 2-3: cap nhat trang thai ban (check-in/out, don dep...).
     * BR05 cua B08: day la diem duy nhat duoc phep doi trang thai van hanh
     * sau khi ban da duoc khoi tao qua B07.
     */
    @PatchMapping("/api/tables/{id}/status")
    @Transactional
    public ResponseEntity<RestaurantTable> updateStatus(
            @PathVariable Long id, @RequestBody TableStatusUpdateRequest req) {

        // Khoa ban ghi (B08 buoc 4) de tranh xung dot doc-ghi dong thoi (EF02)
        RestaurantTable table = tableRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new BusinessException("TABLE_NOT_FOUND", "Khong tim thay ban"));

        // BR02 cua B08: MAINTENANCE co do uu tien cao nhat, chan cac cap nhat khac
        if (table.getStatus() == TableStatus.MAINTENANCE && req.getStatus() != TableStatus.AVAILABLE) {
            throw new BusinessException("TABLE_UNDER_MAINTENANCE",
                    "Ban dang bao tri, khong the cap nhat trang thai khac");
        }

        table.setStatus(req.getStatus());
        // version (@Version tren BaseEntity) tu dong tang, dam bao optimistic locking - BR06
        return ResponseEntity.ok(tableRepository.save(table));
    }
}
