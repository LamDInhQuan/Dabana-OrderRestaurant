package com.dabana.backend.modules.diningtable.dto.request;

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

    @NotNull
    @Min(1)
    private Integer capacity;

    private Integer positionX;
    private Integer positionY;
}