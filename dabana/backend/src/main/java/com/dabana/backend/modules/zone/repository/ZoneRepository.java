package com.dabana.backend.modules.zone.repository;

import com.dabana.backend.modules.zone.entity.Zone;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ZoneRepository extends JpaRepository<Zone, Long> {

    List<Zone> findByBranchIdOrderByIdAsc(Long branchId);

    Optional<Zone> findByBranchIdAndZoneNameIgnoreCase(Long branchId, String zoneName);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT z FROM Zone z WHERE z.id = :id")
    Optional<Zone> findByIdForUpdate(@Param("id") Long id);
}