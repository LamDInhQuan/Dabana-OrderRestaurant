package com.dabana.backend.modules.report.admin.dto;

import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminUserReportResponse {
    private List<KpiCard> kpis;
    private List<ChartPoint> newUsersByTimeByRole;  // series CUSTOMER/RESTAURANT_PARTNER
}
