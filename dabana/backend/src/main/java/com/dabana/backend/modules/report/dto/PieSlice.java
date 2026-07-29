package com.dabana.backend.modules.report.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 1 lát biểu đồ tròn: label + value.
 */
@Data
@Builder
public class PieSlice {
    private String label;
    private BigDecimal value;
}
