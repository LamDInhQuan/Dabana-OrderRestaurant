package com.dabana.backend.modules.report.admin.dto;

import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import com.dabana.backend.modules.report.dto.PieSlice;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminSubscriptionReportResponse {
    private List<KpiCard> kpis;
    private List<ChartPoint> revenueByTime;          // series INITIAL/RENEWAL/UPGRADE
    private List<PieSlice> revenueByPlan;
    private List<PieSlice> subscriptionStatusBreakdown;
    private List<ExpiringSoonRow> upcomingExpiries;

    @Data
    @Builder
    public static class ExpiringSoonRow {
        private Long restaurantId;
        private String restaurantName;
        private String planName;
        private String expiryDate;
    }
}
