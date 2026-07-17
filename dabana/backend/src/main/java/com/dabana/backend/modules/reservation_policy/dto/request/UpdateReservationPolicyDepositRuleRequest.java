package com.dabana.backend.modules.reservation_policy.dto.request;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateReservationPolicyDepositRuleRequest {

    @NotNull
    @Min(1)
    private Integer minGuests;

    @NotNull
    @Min(1)
    private Integer maxGuests;

    @NotNull
    private DepositType depositType;

    @NotNull
    @Min(0)
    private BigDecimal depositValue;
}
