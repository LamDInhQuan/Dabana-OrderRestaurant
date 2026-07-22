package com.dabana.backend.modules.payment.repository;

import com.dabana.backend.modules.payment.entity.DepositPayment;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepositPaymentRepository extends JpaRepository<DepositPayment, Long> {

    @EntityGraph(attributePaths = {"branchBankAccount", "branchBankAccount.bank"})
    Optional<DepositPayment> findFirstByReservation_IdOrderByIdDesc(Long reservationId);

    @EntityGraph(attributePaths = {"branchBankAccount", "branchBankAccount.bank"})
    Optional<DepositPayment> findByReservation_IdAndStatus(Long reservationId, DepositPaymentStatus status);

    /** Lay lenh thu DANG HIEU LUC (PENDING/PROCESSING) - dung de validate truoc khi tao moi / huy. */
    @EntityGraph(attributePaths = {"branchBankAccount", "branchBankAccount.bank"})
    Optional<DepositPayment> findFirstByReservation_IdAndStatusInOrderByIdDesc(
            Long reservationId, List<DepositPaymentStatus> statuses);

    boolean existsByReservation_Id(Long reservationId);

    /** orderCode la ma don hang duy nhat gui len payOS, dung de khop du lieu webhook. */
    Optional<DepositPayment> findByOrderCode(Long orderCode);

    Optional<DepositPayment> findByPayosPaymentLinkId(String payosPaymentLinkId);

    boolean existsByReservation_IdAndStatus(Long reservationId, DepositPaymentStatus status);
}