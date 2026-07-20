package com.dabana.backend.modules.payment.repository;

import com.dabana.backend.modules.payment.entity.BranchBankAccount;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BranchBankAccountRepository extends JpaRepository<BranchBankAccount, Long> {

    /** Moi branch chi co dung 1 tai khoan (UNIQUE branch_id) - dung khi tao link thu coc / man hinh cau hinh. */
    @EntityGraph(attributePaths = {"bank", "branch"})
    Optional<BranchBankAccount> findByBranch_Id(Long branchId);

    boolean existsByBranch_Id(Long branchId);
}