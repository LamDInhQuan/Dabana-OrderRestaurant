package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class BranchPolicyDepositRuleResponse {

    private Long id;

    private Long branchPolicyId;

    private Integer minGuest;

    private Integer maxGuest;

    private Integer minTables;

    private Integer maxTables;

    private DepositType depositType;

    private BigDecimal depositValue;
}
