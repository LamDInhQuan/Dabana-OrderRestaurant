package com.dabana.backend.modules.subscription.dto.response;

import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Ket hop du lieu cuc bo (checkoutUrl/qrCode/invoiceStatus) va du lieu song
 * lay truc tiep tu payOS (payosStatus/amountPaid/amountRemaining, qua
 * payOS.paymentRequests().get(orderCode)) - dung cho man hinh thanh toan cua
 * BillingTab FE, khop dung 2 buoc "info"/"create-link" da co o luong dat coc.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class InvoicePaymentInfoResponse {
    private Long invoiceId;
    /** orderCode gui len payOS = chinh invoiceId (khong sinh ma rieng). */
    private Long orderCode;
    private BigDecimal amount;
    private BigDecimal amountPaid;
    private BigDecimal amountRemaining;
    /** Trang thai tra ve truc tiep tu payOS (vd PAID, PENDING, CANCELLED...). */
    private String payosStatus;
    private String checkoutUrl;
    private String qrCode;
    private InvoiceStatus invoiceStatus;
}
