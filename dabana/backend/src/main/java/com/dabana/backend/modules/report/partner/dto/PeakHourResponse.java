package com.dabana.backend.modules.report.partner.dto;

import com.dabana.backend.modules.report.dto.ChartPoint;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PeakHourResponse {
    private List<ChartPoint> byHour;
    private List<ChartPoint> byDayOfWeek;
}
