package com.dabana.backend.modules.invoice.entity;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.invoice.util.InvoicePaymentMethod;
import com.dabana.backend.modules.invoice.util.InvoiceStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Hoa don thanh toan cuoi buoi cua 1 booking (rs_invoices), duoc tao khi
 * nhan vien xac nhan thanh toan & check-out (BookingService.checkOut).
 * Moi reservation chi co dung 1 hoa don (UNIQUE reservation_id).
 *
 * Khac voi pm_deposit_payments (tien coc thu TRUOC qua payOS luc dat ban),
 * bang nay ghi nhan tong ket CUOI BUOI: mon dat truoc + mon goi them + phu
 * thu - tien coc da thu = so tien khach can tra them.
 */
@Getter
@Setter
@Entity
@Table(name = "rs_invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Booking booking;

    @Column(name = "preorder_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal preorderSubtotal = BigDecimal.ZERO;

    @Column(name = "extra_order_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal extraOrderSubtotal = BigDecimal.ZERO;

    @Column(name = "surcharge", nullable = false, precision = 12, scale = 2)
    private BigDecimal surcharge = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "deposit_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositPaid = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private InvoicePaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // Nhan vien thu ngan xac nhan thanh toan (id_users.id) - null neu he
    // thong tu dong tao (khong dung trong flow hien tai, nhung cho phep null
    // de an toan cho migration cu).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by_user_id")
    private User collectedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
