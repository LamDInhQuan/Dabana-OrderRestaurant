package com.dabana.backend.modules.payment.dto.response;

import com.dabana.backend.modules.payment.util.PayoutApprovalState;
import com.dabana.backend.modules.payment.util.PayoutState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response lenh chi hoan coc.
 *
 * requestedByUserId de nguyen id, chua join sang ho ten nhan vien vi module
 * auth (User) khong nam trong pham vi file nay - mapper co the bo sung
 * requestedByName sau khi xac nhan field thuc te cua entity User.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class PayoutOrderResponse {

    private Long id;
    private Long reservationId;

    private RefundBankInfoResponse refundBankInfo;
    private BranchBankAccountResponse sourceBranchBankAccount;

    private String idempotencyKey;
    private String referenceId;
    private BigDecimal amount;
    private String description;

    private String toBin;
    private String toAccountNumber;
    private String toAccountName;
    private String category;

    private String payosPayoutId;
    private String payosTransactionId;

    private PayoutState state;
    private PayoutApprovalState approvalState;
    private String failureReason;

    private Long requestedByUserId;
    private LocalDateTime payosCreatedAt;
    private LocalDateTime createdAt;
}
