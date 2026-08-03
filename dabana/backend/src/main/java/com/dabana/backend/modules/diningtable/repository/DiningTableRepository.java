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

    List<DiningTable> findByZoneBranchIdAndZoneId(Long branchId, Long zoneId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM DiningTable t WHERE t.id = :id")
    Optional<DiningTable> findByIdForUpdate(@Param("id") Long id);

    // Dung cho BookingService khi doi trang thai nhieu ban cung luc theo vong doi 1 don
    // (1 booking co the gan nhieu ban qua rs_reservation_tables). Lock ghi de tranh
    // xung dot voi thao tac doi trang thai/sap xep khac dang chay song song.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM DiningTable t WHERE t.id IN :ids")
    List<DiningTable> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);

    List<DiningTable> findByZoneBranchIdAndStatus(Long branchId, DiningTableStatus status);
    
    long countByZone_Branch_Id(Long branchId);

    long countByZone_Branch_IdAndStatusIn(Long branchId, List<DiningTableStatus> statuses);

    @Query("SELECT t FROM DiningTable t WHERE t.status = :status AND (t.updatedAt <= :threshold OR (t.updatedAt IS NULL AND t.createdAt <= :threshold))")
    List<DiningTable> findCleaningTablesOlderThan(@Param("status") DiningTableStatus status, @Param("threshold") java.time.LocalDateTime threshold);


}