package com.dabana.backend.modules.subscription.dto.response;

import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.enums.InvoiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class SubscriptionInvoiceResponse {
    private Long id;
    private InvoiceType invoiceType;
    private String planSnapshotName;
    private BigDecimal amount;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private LocalDate dueDate;
    private InvoiceStatus status;
    private LocalDateTime paidAt;
}
