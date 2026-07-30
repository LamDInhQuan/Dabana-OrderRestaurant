package com.dabana.backend.modules.report.admin.dto;

import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import com.dabana.backend.modules.report.dto.PieSlice;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminReservationReportResponse {
    private List<KpiCard> kpis;
    private List<ChartPoint> reservationsByTime;
    private List<PieSlice> statusBreakdown;
    private List<TopBranchRow> topBranches;

    @Data
    @Builder
    public static class TopBranchRow {
        private Long branchId;
        private String branchName;
        private Long reservationCount;
    }
}
