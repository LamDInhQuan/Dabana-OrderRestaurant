package com.dabana.backend.modules.branch2.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.util.BranchCancellationPolicyStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "rt_branch_cancellation_policy")
public class BranchCancellationPolicy extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false, unique = true)
    private Branch branch;

    /**
     * Hủy trước X giờ
     */
    @Column(nullable = false)
    private Integer freeCancellationHours;

    /**
     * % hoàn tiền nếu hủy đúng hạn
     */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal freeCancellationRefundPercent;

    /**
     * % hoàn tiền nếu hủy trễ
     */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal lateCancellationRefundPercent;

    /**
     * % hoàn tiền nếu không đến
     */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal noShowRefundPercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BranchCancellationPolicyStatus status;
}