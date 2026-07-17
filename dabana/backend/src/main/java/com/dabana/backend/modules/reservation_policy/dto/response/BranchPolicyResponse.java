package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class BranchPolicyResponse {

    private Long id;

    private Long branchId;

    private Long policyId;

    private String policyName;

    private DepositType depositType;

    private BigDecimal depositAmount;

    private LocalDateTime effectiveFrom;

    private LocalDateTime effectiveTo;

    private PolicyStatus status;

}