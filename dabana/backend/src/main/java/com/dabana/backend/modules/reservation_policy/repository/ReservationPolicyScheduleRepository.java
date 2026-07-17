package com.dabana.backend.modules.reservation_policy.repository;

import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationPolicyScheduleRepository extends JpaRepository<ReservationPolicySchedule, Long> {

    List<ReservationPolicySchedule> findAllByPolicyIdOrderByIdAsc(Long policyId);

    Optional<ReservationPolicySchedule> findByIdAndPolicyId(Long id, Long policyId);

    boolean existsByPolicyIdAndDayOfWeek(Long policyId, Integer dayOfWeek);
}
