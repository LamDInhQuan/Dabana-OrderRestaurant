package com.dabana.backend.modules.diningtable.mapper;

import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import org.springframework.stereotype.Component;

@Component
public class DiningTableMapper {

    public DiningTableResponse toResponse(DiningTable table) {
        DiningTableResponse response = new DiningTableResponse();
        response.setId(table.getId());
        response.setZoneId(table.getZone().getId());
        response.setZoneName(table.getZone().getZoneName());
        response.setTableName(table.getTableName());
        response.setCapacity(table.getCapacity());
        response.setStatus(table.getStatus() == null ? null : table.getStatus().getCode());
        response.setPositionX(table.getPositionX());
        response.setPositionY(table.getPositionY());
        return response;
    }
}