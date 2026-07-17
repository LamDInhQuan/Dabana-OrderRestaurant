package com.dabana.backend.modules.reservation_policy.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(
        name = "rt_branch_policies",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_branch_policy",
                        columnNames = {"branch_id", "policy_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchPolicy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private ReservationPolicy policy;

    @Column(nullable = false)
    private Integer priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyStatus status;

    @OneToMany(mappedBy = "branchPolicy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BranchPolicyDepositRule> depositRules = new HashSet<>();

    @OneToMany(mappedBy = "branchPolicy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BranchPolicySchedule> schedules = new HashSet<>();
}