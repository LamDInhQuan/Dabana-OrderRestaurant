package com.dabana.backend.modules.subscription.repository;

import com.dabana.backend.modules.subscription.entity.SubscriptionPlan;
import com.dabana.backend.modules.subscription.enums.PlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    List<SubscriptionPlan> findByStatusOrderByDisplayOrderAsc(PlanStatus status);

    Optional<SubscriptionPlan> findByPlanCode(String planCode);
}
