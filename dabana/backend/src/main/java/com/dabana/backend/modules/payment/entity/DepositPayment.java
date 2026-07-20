package com.dabana.backend.modules.payment.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Lenh THU tien coc, map truc tiep theo POST /v2/payment-requests cua payOS.
 * https://payos.vn/docs/api/#tag/payment-request/operation/payment-request
 *
 * Moi reservation chi co dung 1 lenh thu coc dang hieu luc (UNIQUE reservation_id).
 */
@Getter
@Setter
@Entity
@Table(name = "pm_deposit_payments")
public class DepositPayment extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Booking reservation;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_bank_account_id", nullable = false)
    private BranchBankAccount branchBankAccount; // Kenh thanh toan / tai khoan branch nhan tien

    // ---- Request gui len payOS ----

    @NotNull
    @Column(name = "order_code", nullable = false, unique = true)
    private Long orderCode; // orderCode - ma don hang, phai la so nguyen duy nhat

    @NotNull
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount; // payOS yeu cau so tien la so nguyen (VND)

    @NotBlank
    @Column(name = "description", nullable = false, length = 255)
    private String description; // Luu y payOS gioi han ky tu noi dung chuyen khoan voi tk khong lien ket

    @Column(name = "buyer_name", length = 150)
    private String buyerName;

    @Column(name = "buyer_email", length = 150)
    private String buyerEmail;

    @Column(name = "buyer_phone", length = 20)
    private String buyerPhone;

    @NotBlank
    @Column(name = "cancel_url", nullable = false, length = 500)
    private String cancelUrl;

    @NotBlank
    @Column(name = "return_url", nullable = false, length = 500)
    private String returnUrl;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt; // expiredAt - thoi gian het han link thanh toan

    // ---- Response tra ve tu payOS khi tao link ----

    @Column(name = "payos_payment_link_id", length = 100)
    private String payosPaymentLinkId; // data.paymentLinkId

    @Column(name = "checkout_url", length = 500)
    private String checkoutUrl; // data.checkoutUrl

    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode; // data.qrCode

    @Column(name = "bin", length = 10)
    private String bin; // data.bin - tk thuc nhan tien theo payOS

    @Column(name = "account_number", length = 50)
    private String accountNumber; // data.accountNumber

    @Column(name = "account_name", length = 150)
    private String accountName; // data.accountName

    // ---- Trang thai theo doi (dong bo qua GET /v2/payment-requests/{id} va webhook) ----

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DepositPaymentStatus status = DepositPaymentStatus.PENDING;

    @NotNull
    @Column(name = "amount_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "amount_remaining", precision = 12, scale = 2)
    private BigDecimal amountRemaining;

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}