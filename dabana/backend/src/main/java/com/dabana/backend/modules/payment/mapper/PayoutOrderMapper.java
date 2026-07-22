package com.dabana.backend.modules.payment.mapper;

import com.dabana.backend.modules.payment.dto.response.PayoutOrderResponse;
import com.dabana.backend.modules.payment.entity.PayoutOrder;
import org.springframework.stereotype.Component;

@Component
public class PayoutOrderMapper {

    private final RefundBankInfoMapper refundBankInfoMapper;
    private final BranchBankAccountMapper branchBankAccountMapper;

    public PayoutOrderMapper(RefundBankInfoMapper refundBankInfoMapper,
                              BranchBankAccountMapper branchBankAccountMapper) {
        this.refundBankInfoMapper = refundBankInfoMapper;
        this.branchBankAccountMapper = branchBankAccountMapper;
    }

    public PayoutOrderResponse toResponse(PayoutOrder entity) {
        if (entity == null) {
            return null;
        }
        return PayoutOrderResponse.builder()
                .id(entity.getId())
                .reservationId(entity.getReservation() != null ? entity.getReservation().getId() : null)
                .refundBankInfo(refundBankInfoMapper.toResponse(entity.getRefundBankInfo()))
                .sourceBranchBankAccount(branchBankAccountMapper.toResponse(entity.getSourceBranchBankAccount()))
                .idempotencyKey(entity.getIdempotencyKey())
                .referenceId(entity.getReferenceId())
                .amount(entity.getAmount())
                .description(entity.getDescription())
                .toBin(entity.getToBin())
                .toAccountNumber(entity.getToAccountNumber())
                .toAccountName(entity.getToAccountName())
                .category(entity.getCategory())
                .payosPayoutId(entity.getPayosPayoutId())
                .payosTransactionId(entity.getPayosTransactionId())
                .state(entity.getState())
                .approvalState(entity.getApprovalState())
                .failureReason(entity.getFailureReason())
                .requestedByUserId(entity.getRequestedBy() != null ? entity.getRequestedBy().getId() : null)
                .payosCreatedAt(entity.getPayosCreatedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
