package com.dabana.backend.modules.payment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Log webhook thanh toan tu payOS, nhan qua webhook cau hinh o POST /confirm-webhook,
 * payload theo https://payos.vn/docs/api/#tag/payment-webhook/operation/payment-webhook
 *
 * Luu nguyen payload + trang thai da verify chu ky / da xu ly hay chua, de tranh
 * cong don so du 2 lan khi payOS gui lai webhook (retry).
 *
 * Bang nay chi co `created_at` (khong co `updated_at`) nen KHONG ke thua BaseEntity;
 * ban ghi la immutable, chi insert 1 lan.
 */
@Getter
@Setter
@Entity
@Table(name = "pm_payos_webhook_logs")
public class PayosWebhookLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_payment_id")
    private DepositPayment depositPayment; // Khop theo order_code -> pm_deposit_payments

    @Column(name = "order_code")
    private Long orderCode; // data.orderCode

    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount; // data.amount

    @Column(name = "reference", length = 100)
    private String reference; // data.reference - ma giao dich ngan hang

    @Column(name = "transaction_datetime")
    private LocalDateTime transactionDatetime; // data.transactionDateTime

    @Column(name = "account_number", length = 50)
    private String accountNumber; // data.accountNumber

    @Column(name = "counter_account_bank_id", length = 20)
    private String counterAccountBankId; // data.counterAccountBankId (chi co voi MB Bank/ACB/KienlongBank)

    @Column(name = "counter_account_bank_name", length = 150)
    private String counterAccountBankName;

    @Column(name = "counter_account_name", length = 150)
    private String counterAccountName;

    @Column(name = "counter_account_number", length = 50)
    private String counterAccountNumber;

    @Column(name = "webhook_code", length = 10)
    private String webhookCode; // data.code (ma loi payOS, "00" = thanh cong)

    @Column(name = "webhook_desc", length = 255)
    private String webhookDesc; // data.desc

    @Column(name = "raw_payload", columnDefinition = "LONGTEXT", nullable = false)
    private String rawPayload; // Toan bo payload webhook de doi soat khi can (JSON string)

    @Column(name = "signature", length = 255)
    private String signature;

    @Column(name = "signature_verified", nullable = false)
    private Boolean signatureVerified = false; // Ket qua kiem tra HMAC_SHA256 voi checksum key

    @Column(name = "processed", nullable = false)
    private Boolean processed = false; // Da xu ly cap nhat trang thai don thu/chi hay chua

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}