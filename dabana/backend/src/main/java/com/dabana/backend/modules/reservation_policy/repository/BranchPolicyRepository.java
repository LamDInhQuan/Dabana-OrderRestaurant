package com.dabana.backend.modules.reservation_policy.repository;

import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import com.dabana.backend.modules.reservation_policy.util.ScheduleType;
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

    List<BranchPolicy> findAllByBranchId(
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

    @Query("""
                select distinct bp
                from BranchPolicy bp
                left join fetch bp.policy
                left join fetch bp.schedules
                left join fetch bp.depositRules
                where bp.branch.id = :branchId
                  and bp.status = :policyStatus
            """)
    List<BranchPolicy> findActivePolicies(Long branchId , @Param("policyStatus") PolicyStatus policyStatus);

    boolean existsByBranchIdAndPolicyScheduleTypeAndStatus(Long branchId, PolicyScheduleType scheduleType, PolicyStatus status);
}