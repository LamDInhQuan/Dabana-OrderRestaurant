package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * FE chi gui reservationId + surcharge (neu co). Amount KHONG do FE gui - BE
 * tu tinh lai qua IInvoiceService.preview() (preorder + extra order - da tru
 * deposit_paid) de tranh gui sai/gian lan so tien can thu.
 *
 * LUU Y: khac CreateDepositPaymentRequest (co luu DB vao pm_deposit_payments),
 * flow nay KHONG persist gi ca - orderCode tra ve chi song trong session cua
 * modal thanh toan o FE, dung de goi lai GET .../status/{orderCode} khi poll.
 */
@Getter
@Setter
public class CreateInvoicePaymentRequest {

    @NotNull
    private Long reservationId;

    /** Phu thu them (vd phi dich vu), mac dinh 0 - se duoc cong vao amount tinh QR. */
    private BigDecimal surcharge = BigDecimal.ZERO;
}