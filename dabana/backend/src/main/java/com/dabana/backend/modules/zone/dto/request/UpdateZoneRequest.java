package com.dabana.backend.modules.zone.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateZoneRequest {

    @NotBlank
    private String zoneName;

    private String description;
}