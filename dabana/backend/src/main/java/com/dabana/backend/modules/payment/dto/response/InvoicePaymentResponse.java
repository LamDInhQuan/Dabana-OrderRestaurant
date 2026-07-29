package com.dabana.backend.modules.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * KHONG map tu entity DB nao ca (flow nay khong persist) - build truc tiep
 * tu CreatePaymentLinkResponse (luc tao QR) hoac PaymentLink (luc poll status)
 * cua payOS SDK. `status` giu nguyen chuoi payOS tra ve (PENDING/PROCESSING/
 * PAID/CANCELLED...), khong ep ve enum noi bo.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class InvoicePaymentResponse {

    private Long reservationId;
    private Long orderCode;
    private BigDecimal amount;
    private BigDecimal surcharge;

    private String checkoutUrl;
    private String qrCode;
    private String bin;
    private String accountNumber;
    private String accountName;

    private String status;
    private BigDecimal amountPaid;
    private BigDecimal amountRemaining;
}