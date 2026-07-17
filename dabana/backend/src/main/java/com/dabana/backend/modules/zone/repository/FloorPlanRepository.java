package com.dabana.backend.modules.zone.repository;

import com.dabana.backend.modules.zone.entity.FloorPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FloorPlanRepository extends JpaRepository<FloorPlan, Long> {

    Optional<FloorPlan> findByZoneId(Long zoneId);
}
