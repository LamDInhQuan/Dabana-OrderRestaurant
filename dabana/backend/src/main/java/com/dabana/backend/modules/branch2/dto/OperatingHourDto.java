package com.dabana.backend.modules.branch2.dto;

import com.dabana.backend.modules.branch2.util.OperatingDay;
import com.dabana.backend.modules.branch2.validation.ValidOperatingHour;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;

@ValidOperatingHour(message = "Giờ kết thúc phải sau giờ bắt đầu")
@Data
@Builder
@NoArgsConstructor  // 👈 Cần thiết cho Jackson Deserialize (JSON -> Object)
@AllArgsConstructor
public class OperatingHourDto {
    private Long id;

    private OperatingDay dayOfWeek;

    private LocalTime openTime;

    private LocalTime closeTime;

    private String shiftName;
}
