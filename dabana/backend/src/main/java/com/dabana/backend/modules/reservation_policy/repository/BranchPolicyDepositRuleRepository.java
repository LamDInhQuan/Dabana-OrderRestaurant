package com.dabana.backend.modules.reservation_policy.repository;

import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchPolicyDepositRuleRepository extends JpaRepository<BranchPolicyDepositRule, Long> {

    List<BranchPolicyDepositRule> findAllByBranchPolicyIdOrderByMinGuestAsc(Long branchPolicyId);

    Optional<BranchPolicyDepositRule> findByIdAndBranchPolicyId(Long id, Long branchPolicyId);
}
