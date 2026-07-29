package com.dabana.backend.modules.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 1 điểm dữ liệu biểu đồ cột: label + value (cột đơn) + series (cột nhóm/stacked).
 */
@Data
@Builder
public class ChartPoint {
    private String label;                    // vd "2026-07", "T3", "Q3/2026"
    private BigDecimal value;                // dùng cho cột đơn
    private Map<String, BigDecimal> series;  // dùng cho cột nhóm/stacked, key = tên series (vd "INITIAL","RENEWAL")
}
