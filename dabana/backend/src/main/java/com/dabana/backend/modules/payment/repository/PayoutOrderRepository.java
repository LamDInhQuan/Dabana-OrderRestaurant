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

    java.util.List<PayoutOrder> findByState(com.dabana.backend.modules.payment.util.PayoutState state);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM PayoutOrder p WHERE p.state = :state OR p.reservation.refundStatus = :refundStatus")
    java.util.List<PayoutOrder> findPendingOrProcessing(
            @org.springframework.data.repository.query.Param("state") com.dabana.backend.modules.payment.util.PayoutState state,
            @org.springframework.data.repository.query.Param("refundStatus") com.dabana.backend.modules.booking.util.RefundStatus refundStatus);
}