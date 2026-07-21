package com.dabana.backend.modules.diningtable.dto.request;

import java.math.BigDecimal;

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

    @Min(20) @Max(500)
    private Integer width;

    @Min(20) @Max(500)
    private Integer height;

    @Min(0) @Max(359)
    private BigDecimal rotation;
}