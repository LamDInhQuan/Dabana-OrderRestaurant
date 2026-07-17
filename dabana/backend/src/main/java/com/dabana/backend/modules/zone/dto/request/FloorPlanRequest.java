package com.dabana.backend.modules.zone.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FloorPlanRequest {

    @NotNull
    private Long zoneId;

    @NotBlank
    private String layoutData;
}
