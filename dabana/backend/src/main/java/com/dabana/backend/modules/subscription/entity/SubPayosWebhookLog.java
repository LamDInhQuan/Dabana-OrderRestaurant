package com.dabana.backend.modules.subscription.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Nhat ky webhook payOS cho THANH TOAN SUBSCRIPTION - mirror dung cau truc
 * pm_payos_webhook_logs (module payment) nhung FK toi sub_invoices thay vi
 * pm_deposit_payments, vi ban chat 2 dong tien khac han (thu tu nha hang, khong
 * phai khach hang tra coc) nen khong dung chung 1 bang.
 */
@Getter
@Setter
@Entity
@Table(name = "sub_payos_webhook_logs")
public class SubPayosWebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private SubscriptionInvoice invoice;

    @Column(name = "order_code")
    private Long orderCode;

    private BigDecimal amount;

    private String reference;

    @Column(name = "transaction_datetime")
    private LocalDateTime transactionDatetime;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "counter_account_bank_id", length = 20)
    private String counterAccountBankId;

    @Column(name = "counter_account_bank_name", length = 150)
    private String counterAccountBankName;

    @Column(name = "counter_account_name", length = 150)
    private String counterAccountName;

    @Column(name = "counter_account_number", length = 50)
    private String counterAccountNumber;

    @Column(name = "webhook_code", length = 10)
    private String webhookCode;

    @Column(name = "webhook_desc", length = 255)
    private String webhookDesc;

    @Column(name = "raw_payload", columnDefinition = "LONGTEXT", nullable = false)
    private String rawPayload;

    private String signature;

    @Column(name = "signature_verified", nullable = false)
    private boolean signatureVerified;

    @Column(nullable = false)
    private boolean processed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
