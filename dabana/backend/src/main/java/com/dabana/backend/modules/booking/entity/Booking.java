package com.dabana.backend.modules.booking.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.booking.entity.BookingItem;
import com.dabana.backend.modules.booking.entity.BookingTable;
import com.dabana.backend.modules.booking.util.BookingStatus;
import jakarta.persistence.*;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "reservation_time", nullable = false)
    private LocalDateTime reservationTime;

    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    @Column(name = "status", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.HOLDING;

    @Column(name = "policy_snapshot", columnDefinition = "TEXT")
    private String policySnapshot;

    @Column(name = "deposit_amount", precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "estimated_total", precision = 12, scale = 2)
    private BigDecimal estimatedTotal;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @Column(name = "no_show_warning_at")
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
