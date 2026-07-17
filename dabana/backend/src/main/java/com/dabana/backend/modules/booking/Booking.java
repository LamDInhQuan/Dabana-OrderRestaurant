package com.dabana.backend.modules.booking;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
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
@Table(name = "rs_reservations")
public class Booking extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String contactName;

    @NotBlank
    @Column(nullable = false, length = 20)
    private String contactPhone;

    @Column(length = 500)
    private String note;

    @Min(1)
    @Column(nullable = false)
    private Integer guestCount;

    @Column(nullable = false)
    private LocalDateTime reservationTime;

    @Column(nullable = false)
    private LocalDateTime holdExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status = BookingStatus.HOLDING;

    private Boolean snapshotDepositRequired;

    @Column(precision = 12, scale = 2)
    private BigDecimal snapshotDepositAmount;

    private Integer snapshotFreeCancellationHours;

    @Column(length = 100)
    private String paymentTransactionId;

    @Column(length = 30)
    private String paymentStatus;

    private LocalDateTime noShowWarningAt;

    private Boolean reminderSent = false;

    @OneToMany(mappedBy = "booking",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<BookingItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "booking",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<BookingTable> bookingTables = new ArrayList<>();
}