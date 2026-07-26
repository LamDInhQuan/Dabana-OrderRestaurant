package com.dabana.backend.modules.subscription.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubscribeInitialPlanRequest {

    @NotNull(message = "planId không được để trống")
    private Long planId;
}
