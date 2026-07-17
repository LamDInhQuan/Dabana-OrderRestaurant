package com.dabana.backend.modules.diningtable.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkUpdateDiningTablePositionsRequest {

    @NotEmpty
    @Valid
    private List<DiningTablePositionItemRequest> tables;
}