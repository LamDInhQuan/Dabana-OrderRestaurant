package com.dabana.backend.modules.branch2.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BranchCancellationPolicyResponse {

    private Long id;

    private Long branchId;

    private Integer freeCancellationHours;

    private BigDecimal freeCancellationRefundPercent;

    private BigDecimal lateCancellationRefundPercent;

    private BigDecimal noShowRefundPercent;

    private String status;
}