package com.dabana.backend.modules.zone.mapper;

import com.dabana.backend.modules.zone.dto.response.ZoneResponse;
import com.dabana.backend.modules.zone.entity.Zone;
import org.springframework.stereotype.Component;

@Component
public class ZoneMapper {

    public ZoneResponse toResponse(Zone zone) {
        ZoneResponse response = new ZoneResponse();
        response.setId(zone.getId());
        response.setBranchId(zone.getBranch().getId());
        response.setZoneName(zone.getZoneName());
        response.setDescription(zone.getDescription());
        return response;
    }
}