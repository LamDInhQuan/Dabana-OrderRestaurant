package com.dabana.backend.modules.payment.repository;

import com.dabana.backend.modules.payment.entity.PayoutOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PayoutOrderRepository extends JpaRepository<PayoutOrder, Long> {

    @EntityGraph(attributePaths = {"refundBankInfo", "refundBankInfo.bank", "sourceBranchBankAccount"})
    Optional<PayoutOrder> findByReservation_Id(Long reservationId);

    /** Business rule (khong phai UNIQUE o DB): 1 reservation chi duoc tao 1 lenh chi hoan coc. */
    boolean existsByReservation_Id(Long reservationId);

    Optional<PayoutOrder> findByIdempotencyKey(String idempotencyKey);

    Optional<PayoutOrder> findByReferenceId(String referenceId);

    Optional<PayoutOrder> findByPayosPayoutId(String payosPayoutId);
}