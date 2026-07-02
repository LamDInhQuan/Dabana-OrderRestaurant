package com.dabana.backend.modules.waitlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WaitlistRepository extends JpaRepository<WaitlistEntry, Long> {

    /**
     * B10 Buoc 3: lay luot cho dau tien dang cho theo timestamp dang ky (BR01).
     */
    @Query("""
        SELECT w FROM WaitlistEntry w
        WHERE w.branch.id = :branchId
        AND w.status = 'WAITING'
        ORDER BY w.createdAt ASC
        """)
    List<WaitlistEntry> findNextInQueue(@Param("branchId") Long branchId);

    /**
     * B10 EF01: tim cac loi moi da qua han de chuyen sang nguoi ke tiep.
     */
    @Query("SELECT w FROM WaitlistEntry w WHERE w.status = 'INVITED' AND w.inviteExpiresAt < :now")
    List<WaitlistEntry> findExpiredInvites(@Param("now") LocalDateTime now);

    Optional<WaitlistEntry> findByCustomerIdAndBranchIdAndStatus(Long customerId, Long branchId, WaitlistStatus status);

    List<WaitlistEntry> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
