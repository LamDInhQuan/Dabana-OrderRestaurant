package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.BranchCancellationPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BranchCancellationPolicyRepository
        extends JpaRepository<BranchCancellationPolicy, Long> {

    Optional<BranchCancellationPolicy> findByBranchId(Long branchId);

    boolean existsByBranchId(Long branchId);
}