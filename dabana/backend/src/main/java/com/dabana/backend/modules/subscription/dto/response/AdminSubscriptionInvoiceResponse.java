package com.dabana.backend.modules.subscription.dto.response;

import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.enums.InvoiceType;
import com.dabana.backend.modules.subscription.enums.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Dung rieng cho man Admin - co them thong tin nha hang de Admin biet xac nhan
 * thanh toan cho ai, khac voi SubscriptionInvoiceResponse (dung cho /me, nha hang
 * tu xem hoa don cua chinh minh nen khong can lap lai ten nha hang cua ho).
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class AdminSubscriptionInvoiceResponse {
    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private SubscriptionStatus subscriptionStatus;
    private InvoiceType invoiceType;
    private String planSnapshotName;
    private BigDecimal amount;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private LocalDate dueDate;
    private InvoiceStatus status;
    private LocalDateTime paidAt;
    private Boolean downgradeRenewal;
}