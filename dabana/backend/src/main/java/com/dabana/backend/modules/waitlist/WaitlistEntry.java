package com.dabana.backend.modules.waitlist;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.User;
import com.dabana.backend.modules.branch.Branch;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * B10: Dang ky hang cho dat ban. BR01: thu tu theo timestamp dang ky.
 * BR02: han phan hoi loi moi la 10 phut, dung scheduled job chinh xac
 * (khong dung cron polling) de ton trong dung han.
 */
@Getter
@Setter
@Entity
@Table(name = "waitlist_entries")
public class WaitlistEntry extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    private Integer guestCount;

    private LocalDateTime desiredTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WaitlistStatus status = WaitlistStatus.WAITING;

    private LocalDateTime invitedAt;       // Buoc 4: thoi diem gui loi moi
    private LocalDateTime inviteExpiresAt; // BR02: invitedAt + 10 phut

    private Long heldTableId; // ban dang giu cho luot cho nay (neu co)
}
