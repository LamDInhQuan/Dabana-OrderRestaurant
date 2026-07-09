package com.dabana.backend.modules.diningtable.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DiningTablePositionItemRequest {

    @NotNull
    private Long tableId;

    @NotNull
    private Integer positionX;

    @NotNull
    private Integer positionY;
}