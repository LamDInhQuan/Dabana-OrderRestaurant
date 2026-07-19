package com.dabana.backend.modules.reservation_policy.dto;

import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class DepositResult {

    private BranchPolicyDepositRule rule;

    private BigDecimal depositAmount;

}