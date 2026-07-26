package com.dabana.backend.modules.subscription.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpgradePlanRequest {

    @NotNull(message = "newPlanId không được để trống")
    private Long newPlanId;
}
