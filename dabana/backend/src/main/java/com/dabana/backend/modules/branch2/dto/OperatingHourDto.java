package com.dabana.backend.modules.branch2.dto;

import com.dabana.backend.modules.branch2.util.OperatingDay;
import com.dabana.backend.modules.branch2.validation.ValidOperatingHour;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
public class OperatingHourDto {
    private Long id;

    private OperatingDay dayOfWeek;

    private LocalTime openTime;

    @ValidOperatingHour(message = "Giờ kết thúc phải sau giờ bắt đầu")
    private LocalTime closeTime;

    private String shiftName;
}
