package com.dabana.backend.modules.invoice.dto.request;

import com.dabana.backend.modules.invoice.util.InvoicePaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Body cho POST /api/bookings/{id}/check-out - nhan vien xac nhan da thu
 * tien truoc khi he thong dong don + chuyen ban sang Don dep. Neu khong co
 * FE cu goi khong kem body (payment_method null), BookingService se bao loi
 * PAYMENT_METHOD_REQUIRED thay vi ngam dinh mot phuong thuc, tranh ghi
 * nhan sai lech so lieu thu ngan.
 */
@Data
public class ConfirmCheckoutRequest {

    @NotNull
    private InvoicePaymentMethod paymentMethod;

    /** Phu thu them (vd: phi dich vu) neu co, mac dinh 0. */
    private BigDecimal surcharge = BigDecimal.ZERO;
}
