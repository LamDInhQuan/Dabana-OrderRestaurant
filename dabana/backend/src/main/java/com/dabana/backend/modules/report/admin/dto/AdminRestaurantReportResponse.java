package com.dabana.backend.modules.report.admin.dto;

import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import com.dabana.backend.modules.report.dto.PieSlice;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminRestaurantReportResponse {
    private List<KpiCard> kpis;
    private List<ChartPoint> newRestaurantsByTime;
    private List<PieSlice> approvalStatusBreakdown;
}
