package com.dabana.backend.modules.zone.dto.response;

import lombok.Data;

@Data
public class FloorPlanResponse {

    private Long id;
    private Long zoneId;
    private String layoutData;
    private Integer version;
}
