package com.dabana.backend.modules.reservation_policy.dto.request;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import com.dabana.backend.modules.reservation_policy.util.RefundType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateBranchPolicyRequest {

    @NotNull
    private DepositType depositType;

    @NotNull
    @Positive
    private BigDecimal depositAmount;

    @NotNull
    private LocalDateTime effectiveFrom;

    private LocalDateTime effectiveTo;

    @NotNull
    private PolicyStatus status;

}