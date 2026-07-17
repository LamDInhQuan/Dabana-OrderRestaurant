package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.BranchScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BranchScheduleExceptionRepository
        extends JpaRepository<BranchScheduleException, Long> {

    List<BranchScheduleException> findByBranchIdOrderByStartDateAsc(Long branchId);

    Optional<BranchScheduleException> findByIdAndBranchId(
            Long id,
            Long branchId);

    @Query("""
        SELECT e
        FROM BranchScheduleException e
        WHERE e.branch.id = :branchId
        AND (
            e.startDate <= :endDate
            AND e.endDate >= :startDate
        )
        """)
    List<BranchScheduleException> findByBranchIdAndDateRange(
            @Param("branchId") Long branchId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT e
        FROM BranchScheduleException e
        WHERE e.branch.id = :branchId
        AND :date BETWEEN e.startDate AND e.endDate
    """)
    List<BranchScheduleException> findEffectiveExceptions(
            Long branchId,
            LocalDate date);
}