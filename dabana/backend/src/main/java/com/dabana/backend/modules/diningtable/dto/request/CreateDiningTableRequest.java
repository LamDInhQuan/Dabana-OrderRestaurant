package com.dabana.backend.modules.diningtable.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateDiningTableRequest {

    @NotNull
    private Long zoneId;

    @NotBlank
    private String tableName;

    @NotNull @Min(1)
    private Integer capacity;

    @Min(0) @Max(100)
    private Integer positionX;

    @Min(0) @Max(100)
    private Integer positionY;
}