package com.dabana.backend.modules.table_layout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ZoneRepository extends JpaRepository<Zone, Long> {
    List<Zone> findByBranchIdAndActiveTrue(Long branchId);
    List<Zone> findByBranchId(Long branchId);
}
