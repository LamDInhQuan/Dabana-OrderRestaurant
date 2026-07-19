package com.dabana.backend.modules.zone.repository;

import com.dabana.backend.modules.zone.entity.FloorPlan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FloorPlanRepository extends JpaRepository<FloorPlan, Long> {

    Optional<FloorPlan> findByZoneId(Long zoneId);

    // PESSIMISTIC_WRITE de serialize hoa moi thao tac doc-sua-ghi layout_data cua cung
    // 1 zone. Bat buoc phai goi ham nay TRUOC KHI dong bat ky luong nao dinh sua vi tri
    // ban (ca tu DiningTableService lan ZoneService), de tranh lost-update khi 2 request
    // chay dong thoi tren cung 1 zone.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT fp FROM FloorPlan fp WHERE fp.zone.id = :zoneId")
    Optional<FloorPlan> findByZoneIdForUpdate(@Param("zoneId") Long zoneId);
}