package com.dabana.backend.modules.report.partner.dto;

import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import com.dabana.backend.modules.report.dto.PieSlice;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PartnerDepositReportResponse {
    private List<KpiCard> kpis;
    private List<ChartPoint> cashflowByTime;
    private List<PieSlice> depositProcessingBreakdown;
}
