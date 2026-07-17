package com.dabana.backend.modules.reservation_policy.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import com.dabana.backend.modules.restaurant.entity.Restaurant;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "rt_reservation_policies",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_restaurant_policy",
                        columnNames = {"restaurant_id", "policy_code"}
                )
        }
)
public class ReservationPolicy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "policy_code", nullable = false, length = 50)
    private String policyCode;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false)
    private PolicyScheduleType scheduleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyStatus status;

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ReservationPolicyDepositRule> depositRules = new HashSet<>();

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ReservationPolicySchedule> schedules = new HashSet<>();
}
