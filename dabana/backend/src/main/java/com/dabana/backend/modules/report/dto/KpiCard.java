package com.dabana.backend.modules.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 1 thẻ KPI: label + value + previousValue + changePercent.
 */
@Data
@Builder
public class KpiCard {
    private String key;               // vd "totalRevenue"
    private String label;             // vd "Doanh thu phí nền tảng"
    private BigDecimal value;
    private BigDecimal previousValue; // null nếu compareWithPrevious=false
    private Double changePercent;     // null nếu không so sánh
}
