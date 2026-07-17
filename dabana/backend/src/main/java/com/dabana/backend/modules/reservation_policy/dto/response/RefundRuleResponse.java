package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.RefundType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class RefundRuleResponse {

    private Long id;

    private Integer minutesBefore;

    private RefundType refundType;

    private BigDecimal refundValue;

}