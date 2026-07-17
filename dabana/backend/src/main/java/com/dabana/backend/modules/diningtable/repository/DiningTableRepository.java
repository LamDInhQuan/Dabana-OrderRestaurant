package com.dabana.backend.modules.diningtable.repository;

import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DiningTableRepository extends JpaRepository<DiningTable, Long> {

    List<DiningTable> findByZoneIdOrderByIdAsc(Long zoneId);

    List<DiningTable> findByZoneIdInOrderByZoneIdAscIdAsc(Collection<Long> zoneIds);

    Optional<DiningTable> findByZoneIdAndTableNameIgnoreCase(Long zoneId, String tableName);

    List<DiningTable> findByZoneBranchId(Long branchId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM DiningTable t WHERE t.id = :id")
    Optional<DiningTable> findByIdForUpdate(@Param("id") Long id);

    List<DiningTable> findByZoneBranchIdAndStatus(Long branchId, DiningTableStatus status);
}