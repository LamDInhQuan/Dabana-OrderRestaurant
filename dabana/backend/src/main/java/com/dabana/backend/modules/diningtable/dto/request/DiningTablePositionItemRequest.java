package com.dabana.backend.modules.diningtable.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DiningTablePositionItemRequest {

    @NotNull
    private Long tableId;

    @NotNull @Min(0) @Max(100)
    private Integer positionX;

    @NotNull @Min(0) @Max(100)
    private Integer positionY;
}