package com.dabana.backend.modules.payment.repository;

import com.dabana.backend.modules.payment.entity.DepositPayment;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DepositPaymentRepository extends JpaRepository<DepositPayment, Long> {

    /** Moi reservation chi co dung 1 lenh thu coc dang hieu luc (UNIQUE reservation_id). */
    @EntityGraph(attributePaths = {"branchBankAccount", "branchBankAccount.bank"})
    Optional<DepositPayment> findByReservation_Id(Long reservationId);

    boolean existsByReservation_Id(Long reservationId);

    /** orderCode la ma don hang duy nhat gui len payOS, dung de khop du lieu webhook. */
    Optional<DepositPayment> findByOrderCode(Long orderCode);

    Optional<DepositPayment> findByPayosPaymentLinkId(String payosPaymentLinkId);

    boolean existsByReservation_IdAndStatus(Long reservationId, DepositPaymentStatus status);
}