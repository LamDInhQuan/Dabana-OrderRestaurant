package com.dabana.backend.modules.reservation_policy.repository;

import com.dabana.backend.modules.reservation_policy.entity.BranchPolicySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchPolicyScheduleRepository extends JpaRepository<BranchPolicySchedule, Long> {

    List<BranchPolicySchedule> findAllByBranchPolicyIdOrderByIdAsc(Long branchPolicyId);

    Optional<BranchPolicySchedule> findByIdAndBranchPolicyId(Long id, Long branchPolicyId);
}
