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
    // 2. Map một DTO đơn lẻ sang Entity (dùng cho create)
    public OperatingHour toEntity(OperatingHourDto dto, Branch branch) {
        if (dto == null) return null;
        OperatingHour entity = new OperatingHour();
        entity.setBranch(branch);
        entity.setDayOfWeek(dto.getDayOfWeek());
        entity.setOpenTime(dto.getOpenTime());
        entity.setCloseTime(dto.getCloseTime());
        entity.setShiftName(dto.getShiftName());
//        entity.setIsClosed(dto.getIsClosed()); // Bổ sung nếu entity có trường này
        return entity;
    }

    public OperatingHourDto mapToDto(OperatingHour entity) {
        if (entity == null) return null;
        return OperatingHourDto.builder()
                .id(entity.getId())
                .dayOfWeek(entity.getDayOfWeek() != null ? entity.getDayOfWeek() : null)
                .openTime(entity.getOpenTime())
                .closeTime(entity.getCloseTime())
                .build();
    }
}
