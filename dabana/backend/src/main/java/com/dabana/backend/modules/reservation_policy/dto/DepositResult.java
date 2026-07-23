package com.dabana.backend.modules.reservation_policy.dto;

import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DepositResult {

    private BranchPolicyDepositRule rule;

    private BigDecimal depositAmount;

}