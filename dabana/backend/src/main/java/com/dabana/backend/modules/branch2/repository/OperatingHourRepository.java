package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.OperatingHour;
import com.dabana.backend.modules.branch2.util.OperatingDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.util.List;

public interface OperatingHourRepository extends JpaRepository<OperatingHour, Long> {
    List<OperatingHour> findByBranchIdOrderByDayOfWeekAscOpenTimeAsc(Long branchId);

    List<OperatingHour> findByBranchId(Long branchId);

    @Modifying
    @Query("DELETE FROM OperatingHour b WHERE b.branch.id = :branchId")
    void deleteByBranchId(@Param("branchId") Long branchId);

    boolean existsByBranchId(Long branchId);

    List<OperatingHour> findByBranchIdAndDayOfWeekOrderByOpenTimeAsc(
            Long branchId,
            OperatingDay operatingDay
    );
}
