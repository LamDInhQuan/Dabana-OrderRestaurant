package com.dabana.backend.modules.payment.mapper;

import com.dabana.backend.modules.payment.dto.response.DepositPaymentResponse;
import com.dabana.backend.modules.payment.entity.DepositPayment;
import org.springframework.stereotype.Component;

@Component
public class DepositPaymentMapper {

    public DepositPaymentResponse toResponse(DepositPayment entity) {
        if (entity == null) {
            return null;
        }
        return DepositPaymentResponse.builder()
                .id(entity.getId())
                .reservationId(entity.getReservation() != null ? entity.getReservation().getId() : null)
                .orderCode(entity.getOrderCode())
                .amount(entity.getAmount())
                .description(entity.getDescription())
                .buyerName(entity.getBuyerName())
                .buyerEmail(entity.getBuyerEmail())
                .buyerPhone(entity.getBuyerPhone())
                .cancelUrl(entity.getCancelUrl())
                .returnUrl(entity.getReturnUrl())
                .expiredAt(entity.getExpiredAt())
                .payosPaymentLinkId(entity.getPayosPaymentLinkId())
                .checkoutUrl(entity.getCheckoutUrl())
                .qrCode(entity.getQrCode())
                .bin(entity.getBin())
                .accountNumber(entity.getAccountNumber())
                .accountName(entity.getAccountName())
                .status(entity.getStatus())
                .amountPaid(entity.getAmountPaid())
                .amountRemaining(entity.getAmountRemaining())
                .cancellationReason(entity.getCancellationReason())
                .canceledAt(entity.getCanceledAt())
                .paidAt(entity.getPaidAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
