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

    /** Dung cho job dong bo dinh ky (PayoutOrderService#syncProcessingPayouts) -
     * payOS hien KHONG co webhook cho lenh chi (chi co webhook cho link thanh toan,
     * da xac nhan qua tai lieu chinh thuc https://payos.vn/docs/api/), nen phai
     * chu dong poll GET /v1/payouts/{payoutId} cho cac lenh con dang xu ly. */
    java.util.List<PayoutOrder> findByState(com.dabana.backend.modules.payment.util.PayoutState state);
}