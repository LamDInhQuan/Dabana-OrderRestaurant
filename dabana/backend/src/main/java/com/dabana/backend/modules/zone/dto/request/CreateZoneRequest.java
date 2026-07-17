package com.dabana.backend.modules.zone.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateZoneRequest {

    @NotNull
    private Long branchId;

    @NotBlank
    private String zoneName;

    private String description;
}