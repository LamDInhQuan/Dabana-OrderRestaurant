package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class ReservationPolicyDepositRuleResponse {

    private Long id;

    private Long policyId;

    private Integer minGuest;

    private Integer maxGuest;

    private DepositType depositType;

    private BigDecimal depositValue;
}
