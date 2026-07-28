package com.dabana.backend.modules.subscription.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.enums.InvoiceType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * sub_invoices - moi hoa don chot gia (amount) va han muc (maxBranchesSnapshot)
 * TAI DUNG THOI DIEM PHAT HANH, khong tham chieu dong den SubscriptionPlan.
 * Luu them "plan" (khong chi ten/gia) de biet chinh xac se ap dung goi nao vao
 * subscription khi xac nhan thanh toan (quan trong voi hoa don RENEWAL ap dung
 * goi da dat lich ha cap).
 */
@Getter
@Setter
@Entity
@Table(name = "sub_invoices")
public class SubscriptionInvoice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private RestaurantSubscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 20)
    private InvoiceType invoiceType;

    @Column(name = "plan_snapshot_name", nullable = false, length = 100)
    private String planSnapshotName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "max_branches_snapshot", nullable = false)
    private Integer maxBranchesSnapshot;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // ---- payOS: link thanh toan cua hoa don nay (orderCode gui len payOS = chinh id cua hoa don) ----

    @Column(name = "checkout_url", length = 500)
    private String checkoutUrl;

    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;

    /**
     * true neu day la hoa don RENEWAL nhung ap dung goi DA DAT LICH HA CAP
     * (khong phai gia han binh thuong len dung gia goi cu) - chi de HIEN THI
     * ro rang hon cho nha hang, khong anh huong logic tinh tien/ky han.
     */
    @Column(name = "is_downgrade_renewal", nullable = false)
    private Boolean downgradeRenewal = false;
}