package com.dabana.backend.modules.booking;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.table_layout.RestaurantTable;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * B01: Don dat ban truc tuyen - thuc the trung tam cua he thong.
 *
 * Quan trong: cac truong "snapshot*" luu lai gia tri chinh sach/gia tai
 * thoi diem giu ban (BR06 cua B05, BR04 cua B06), KHONG tham chieu dong
 * den DepositPolicy/MenuItem hien hanh trong suot vong doi don, dung theo
 * dac ta BR06 (B05), BR04 (B06), BR06 (B01).
 */
@Getter
@Setter
@Entity
@Table(name = "rs_reservations", uniqueConstraints = {
        // BR01 cua B01: mot ban khong duoc ton tai nhieu don trung thoi gian
        @UniqueConstraint(name = "uk_table_timeslot",
                columnNames = {"table_id", "reservation_time"})
})
public class Booking extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private com.dabana.backend.modules.branch2.entity.Branch branch;

    @ManyToOne
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String contactName; // B01 buoc 4

    @NotBlank
    @Column(nullable = false, length = 20)
    private String contactPhone;

    @Column(length = 500)
    private String note;

    @Min(1)
    @Column(nullable = false)
    private Integer guestCount;

    @Column(nullable = false)
    private LocalDateTime reservationTime; // gio den du kien

    @Column(nullable = false)
    private LocalDateTime holdExpiresAt; // B01 BR03: het han giu ban (15 phut)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status = BookingStatus.HOLDING;

    // ===== Snapshot chinh sach dat coc (chot tai B01 buoc 6-7) =====
    private Boolean snapshotDepositRequired;
    @Column(precision = 12, scale = 2)
    private BigDecimal snapshotDepositAmount;
    private Integer snapshotFreeCancellationHours;

    // ===== Thanh toan =====
    @Column(length = 100)
    private String paymentTransactionId;
    @Column(length = 30)
    private String paymentStatus; // PENDING / SUCCESS / FAILED

    // ===== No-show tracking (B08 EF01 / B11) =====
    private LocalDateTime noShowWarningAt;
    private Boolean reminderSent = false;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingItem> items = new ArrayList<>(); // mon dat truoc - B01 buoc 5
}
