package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import com.dabana.backend.modules.reservation_policy.util.PolicyApplyType;
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

    private String policyCode;

    private String policyName;

    private PolicyStatus status;

    private Boolean hasDepositOverride;

    private Boolean hasScheduleOverride;

}