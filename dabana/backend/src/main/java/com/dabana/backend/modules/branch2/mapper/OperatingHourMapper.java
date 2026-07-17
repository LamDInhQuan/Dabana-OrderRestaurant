package com.dabana.backend.modules.branch2.mapper;

import com.dabana.backend.modules.branch2.dto.OperatingHourDto;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.OperatingHour;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OperatingHourMapper {
    public List<OperatingHour> toEntity(List<OperatingHourDto> requests, Branch branch) {
        List<OperatingHour> entities = requests.stream()
                .map(dto -> {
                    OperatingHour entity = new OperatingHour();
                    entity.setBranch(branch);
                    entity.setDayOfWeek(dto.getDayOfWeek());
                    entity.setOpenTime(dto.getOpenTime());
                    entity.setCloseTime(dto.getCloseTime());
                    entity.setShiftName(dto.getShiftName());
                    return entity;
                })
                .toList();
        return entities;
    }

}
