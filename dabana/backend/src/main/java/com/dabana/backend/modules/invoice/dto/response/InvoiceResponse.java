package com.dabana.backend.modules.invoice.dto.response;

import com.dabana.backend.modules.invoice.util.InvoicePaymentMethod;
import com.dabana.backend.modules.invoice.util.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Hoa don da duoc ghi nhan sau khi nhan vien xac nhan thanh toan xong. */
@Data
@Builder
public class InvoiceResponse {
    private Long id;
    private Long bookingId;
    private BigDecimal preorderSubtotal;
    private BigDecimal extraOrderSubtotal;
    private BigDecimal surcharge;
    private BigDecimal grandTotal;
    private BigDecimal depositPaid;
    private BigDecimal amountCollected; // grandTotal - depositPaid, so tien thuc thu tai quay
    private InvoicePaymentMethod paymentMethod;
    private InvoiceStatus status;
    private LocalDateTime paidAt;
    private String collectedByName;
}
