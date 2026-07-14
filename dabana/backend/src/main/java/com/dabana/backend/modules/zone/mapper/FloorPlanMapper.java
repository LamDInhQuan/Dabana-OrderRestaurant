package com.dabana.backend.modules.zone.mapper;

import com.dabana.backend.modules.zone.dto.response.FloorPlanResponse;
import com.dabana.backend.modules.zone.entity.FloorPlan;
import org.springframework.stereotype.Component;

@Component
public class FloorPlanMapper {

    public FloorPlanResponse toResponse(FloorPlan floorPlan) {
        FloorPlanResponse response = new FloorPlanResponse();
        response.setId(floorPlan.getId());
        response.setZoneId(floorPlan.getZone().getId());
        response.setLayoutData(floorPlan.getLayoutData());
        response.setVersion(floorPlan.getVersion());
        return response;
    }
}
