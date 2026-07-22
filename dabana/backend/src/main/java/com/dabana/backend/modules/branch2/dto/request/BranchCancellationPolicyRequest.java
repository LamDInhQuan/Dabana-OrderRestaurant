package com.dabana.backend.modules.branch2.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BranchCancellationPolicyRequest {

    @NotNull
    @Min(0)
    private Integer freeCancellationHours;

    @NotNull
    @DecimalMin("0")
    @DecimalMax("100")
    private BigDecimal freeCancellationRefundPercent;

    @NotNull
    @DecimalMin("0")
    @DecimalMax("100")
    private BigDecimal lateCancellationRefundPercent;

    @NotNull
    @DecimalMin("0")
    @DecimalMax("100")
    private BigDecimal noShowRefundPercent;
}