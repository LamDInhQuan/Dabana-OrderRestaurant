package com.dabana.backend.modules.zone.dto.response;

import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ZoneResponse {

    private Long id;
    private Long branchId;
    private String zoneName;
    private String description;
    private FloorPlanResponse floorPlan;
    private List<DiningTableResponse> tables = new ArrayList<>();
}