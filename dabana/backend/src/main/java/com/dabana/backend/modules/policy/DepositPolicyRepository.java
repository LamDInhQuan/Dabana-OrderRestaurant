package com.dabana.backend.modules.policy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DepositPolicyRepository extends JpaRepository<DepositPolicy, Long> {
    Optional<DepositPolicy> findByBranchId(Long branchId);
}
