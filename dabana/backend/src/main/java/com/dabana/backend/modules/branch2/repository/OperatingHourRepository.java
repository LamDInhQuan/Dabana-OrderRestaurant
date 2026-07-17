package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.OperatingHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;

public interface OperatingHourRepository extends JpaRepository<OperatingHour, Long> {
    List<OperatingHour> findByBranchIdOrderByDayOfWeekAscOpenTimeAsc(Long branchId);

    List<OperatingHour> findByBranchId(Long branchId);

    void deleteByBranchId(Long branchId);

    boolean existsByBranchId(Long branchId);

    List<OperatingHour> findByBranchIdAndDayOfWeekOrderByOpenTimeAsc(
            Long branchId,
            DayOfWeek dayOfWeek
    );
}
