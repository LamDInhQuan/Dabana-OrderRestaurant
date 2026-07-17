package com.dabana.backend.modules.reservation_policy.dto.request;

import com.dabana.backend.modules.reservation_policy.util.RefundType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateRefundRuleRequest {

    @NotNull
    @PositiveOrZero
    private Integer minutesBefore;

    @NotNull
    private RefundType refundType;

    @NotNull
    @PositiveOrZero
    private BigDecimal refundValue;

}