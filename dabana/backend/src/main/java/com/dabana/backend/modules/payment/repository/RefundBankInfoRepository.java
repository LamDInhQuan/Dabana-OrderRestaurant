package com.dabana.backend.modules.payment.repository;

import com.dabana.backend.modules.payment.entity.RefundBankInfo;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefundBankInfoRepository extends JpaRepository<RefundBankInfo, Long> {

    /** Moi reservation chi nhap dung 1 lan thong tin tk nhan hoan tien (UNIQUE reservation_id). */
    @EntityGraph(attributePaths = {"bank"})
    Optional<RefundBankInfo> findByReservation_Id(Long reservationId);

    boolean existsByReservation_Id(Long reservationId);
}