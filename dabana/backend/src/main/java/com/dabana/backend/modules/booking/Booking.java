package com.dabana.backend.modules.booking;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch2.entity.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "rs_reservations")
public class Booking extends BaseEntity {

    // Kế thừa từ BaseEntity (nếu BaseEntity của bạn đã có trường id kiểu Long tương ứng với bigint)
    // Trường hợp BaseEntity chưa cấu hình id, bạn mở comment 3 dòng dưới này:
    // @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    // private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @NotNull
    @Column(name = "reservation_time", nullable = false)
    private LocalDateTime reservationTime;

    @NotNull
    @Min(1)
    @Column(name = "guest_count", nullable = false)
    private Byte guestCount; // Khớp với tinyint(4) trong DB giúp tối ưu bộ nhớ

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30) // Tùy biến length theo cấu hình enum cũ của bạn
    private BookingStatus status;

    @Column(name = "estimated_total", precision = 12, scale = 2)
    private BigDecimal estimatedTotal;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    // Lưu ý: 2 trường created_at và updated_at thường đã được xử lý tự động trong BaseEntity bằng @CreatedDate / @LastModifiedDate

    @NotBlank
    @Column(name = "contact_name", nullable = false, length = 150)
    private String contactName;

    @NotBlank
    @Column(name = "contact_phone", nullable = false, length = 20)
    private String contactPhone;

    @NotBlank
    @Column(name = "contact_email", nullable = false, length = 20)
    private String contactEmail;

    @Column(name = "no_show_warning_at")
    private LocalDateTime noShowWarningAt;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "payment_status", length = 30)
    private String paymentStatus;

    @Column(name = "payment_transaction_id", length = 100)
    private String paymentTransactionId;

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false; // Khớp với bit(1)

    @Column(name = "snapshot_deposit_amount", precision = 12, scale = 2)
    private BigDecimal snapshotDepositAmount;

    @Column(name = "snapshot_deposit_required")
    private Boolean snapshotDepositRequired; // Khớp với bit(1)

    @Column(name = "snapshot_free_cancellation_hours")
    private Integer snapshotFreeCancellationHours; // Khớp với int(11)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = true) // Khớp với customer_id kiểu bigint(20)
    private User customer;

    @Column(name = "snapshot_policy_name", length = 150)
    private String snapshotPolicyName;

    // --- Bổ sung thêm các mối quan hệ Mapping nếu cần dùng ở tầng Service ---

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingTable> bookingTables = new ArrayList<>();

    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;
}