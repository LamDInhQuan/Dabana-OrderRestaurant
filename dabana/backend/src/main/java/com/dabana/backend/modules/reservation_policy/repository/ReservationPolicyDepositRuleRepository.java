package com.dabana.backend.modules.reservation_policy.repository;

import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicyDepositRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationPolicyDepositRuleRepository extends JpaRepository<ReservationPolicyDepositRule, Long> {

    List<ReservationPolicyDepositRule> findAllByPolicyIdOrderByMinGuestAsc(Long policyId);

    Optional<ReservationPolicyDepositRule> findByIdAndPolicyId(Long id, Long policyId);
}
