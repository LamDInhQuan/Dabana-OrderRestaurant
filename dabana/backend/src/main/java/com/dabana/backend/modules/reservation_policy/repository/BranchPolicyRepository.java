package com.dabana.backend.modules.reservation_policy.repository;

import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchPolicyRepository
        extends JpaRepository<BranchPolicy, Long> {

    Optional<BranchPolicy> findByBranchIdAndPolicyId(
            Long branchId,
            Long policyId
    );

    @Query("""
    SELECT DISTINCT bp
    FROM BranchPolicy bp
    LEFT JOIN FETCH bp.depositRules
    LEFT JOIN FETCH bp.schedules
    LEFT JOIN FETCH bp.policy
    WHERE bp.id = :branchPolicyId
      AND bp.branch.id = :branchId
""")
    Optional<BranchPolicy> findDetailByIdAndBranchId(
            @Param("branchPolicyId") Long branchPolicyId,
            @Param("branchId") Long branchId
    );

    List<BranchPolicy> findAllByBranchIdOrderByPriorityDesc(
            Long branchId
    );

    boolean existsByBranchIdAndPolicyId(
            Long branchId,
            Long policyId
    );

    Optional<BranchPolicy> findByIdAndBranchId(
            Long id,
            Long branchId
    );

}