package com.dabana.backend.modules.report.partner.dto;

import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import com.dabana.backend.modules.report.dto.PieSlice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class PartnerRevenueReportResponse {
    private List<KpiCard> kpis;
    private List<ChartPoint> revenueByTime;
    private List<PieSlice> revenueComposition;
    private List<PieSlice> paymentMethodBreakdown;
    private List<CashierRow> topCashiers;

    @Data
    @Builder
    public static class CashierRow {
        private Long userId;
        private String cashierName;
        private Long invoiceCount;
        private BigDecimal totalCollected;
    }
}
