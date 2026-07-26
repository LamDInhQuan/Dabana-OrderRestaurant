package com.dabana.backend.modules.subscription.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.subscription.enums.SuspensionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * sub_branch_suspensions - nhat ky tam ngung chi nhanh do QUA HAN THANH TOAN.
 * Tach rieng khoi Branch.status (dung chung BranchStatus.SUSPENDED) de biet dung
 * nguyen nhan tam ngung la gi va khoi phuc dung thu tu khi nha hang tra phi lai.
 */
@Getter
@Setter
@Entity
@Table(name = "sub_branch_suspensions")
public class BranchSuspension extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private RestaurantSubscription subscription;

    @Column(nullable = false, length = 100)
    private String reason = "OVER_BRANCH_LIMIT_AFTER_EXPIRY";

    @Column(name = "suspended_at", nullable = false)
    private LocalDateTime suspendedAt = LocalDateTime.now();

    @Column(name = "restored_at")
    private LocalDateTime restoredAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SuspensionStatus status = SuspensionStatus.ACTIVE;
}
