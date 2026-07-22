package com.dabana.backend.modules.payment.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.payment.util.PayoutApprovalState;
import com.dabana.backend.modules.payment.util.PayoutState;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Lenh CHI hoan coc, map truc tiep theo POST /v1/payouts (lenh chi don).
 * https://payos.vn/docs/api/#tag/payout/operation/create-single-payout
 */
@Getter
@Setter
@Entity
@Table(name = "pm_payout_orders")
public class PayoutOrder extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Booking reservation;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_bank_info_id", nullable = false)
    private RefundBankInfo refundBankInfo; // Tai khoan khach nhan hoan tien

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_branch_bank_account_id", nullable = false)
    private BranchBankAccount sourceBranchBankAccount; // Branch chiu chi phi hoan coc nay (doi soat noi bo)

    // ---- Header bat buoc khi goi payOS ----

    @NotBlank
    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey; // x-idempotency-key - dam bao khong tao trung lenh chi

    // ---- Request body gui len payOS ----

    @NotBlank
    @Column(name = "reference_id", nullable = false, unique = true, length = 100)
    private String referenceId; // referenceId - ma tham chieu lenh chi phia dabana

    @NotNull
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount; // amount - so nguyen (VND)

    @NotBlank
    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @NotBlank
    @Column(name = "to_bin", nullable = false, length = 10)
    private String toBin; // toBin - snapshot tu bank_id cua refund_bank_info luc tao lenh

    @NotBlank
    @Column(name = "to_account_number", nullable = false, length = 50)
    private String toAccountNumber; // toAccountNumber - snapshot luc tao lenh

    @Column(name = "category", length = 255)
    private String category; // vd: refund_deposit

    // ---- Response tra ve tu payOS ----

    @Column(name = "payos_payout_id", length = 100)
    private String payosPayoutId; // data.id (payout_xxx)

    @Column(name = "payos_transaction_id", length = 100)
    private String payosTransactionId; // data.transactions[0].id (txn_xxx)

    @Column(name = "to_account_name", length = 150)
    private String toAccountName; // data.transactions[0].toAccountName - ten chu tk do payOS xac thuc

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 20)
    private PayoutState state = PayoutState.PROCESSING; // data.transactions[0].state

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_state", nullable = false, length = 20)
    private PayoutApprovalState approvalState = PayoutApprovalState.PROCESSING; // data.approvalState

    @Column(name = "failure_reason", length = 500)
    private String failureReason; // Mo ta loi neu payout that bai (code/desc tra ve tu payOS)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_user_id")
    private User requestedBy; // Nhan vien xac nhan tao lenh chi hoan coc

    @Column(name = "payos_created_at")
    private LocalDateTime payosCreatedAt; // data.createdAt
}