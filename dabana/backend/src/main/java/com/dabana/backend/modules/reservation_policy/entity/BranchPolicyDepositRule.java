package com.dabana.backend.modules.reservation_policy.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.reservation_policy.util.DepositType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "rt_branch_policy_deposit_rules")
public class BranchPolicyDepositRule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_policy_id", nullable = false)
    private BranchPolicy branchPolicy;

    @Column(name = "min_guest", nullable = false)
    private Integer minGuest;

    @Column(name = "max_guest", nullable = false)
    private Integer maxGuest;

    @Enumerated(EnumType.STRING)
    @Column(name = "deposit_type", nullable = false)
    private DepositType depositType;

    @Column(name = "deposit_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositValue;
}
