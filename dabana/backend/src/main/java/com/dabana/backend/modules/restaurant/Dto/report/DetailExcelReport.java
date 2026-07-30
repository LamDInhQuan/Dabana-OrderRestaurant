package com.dabana.backend.modules.restaurant.Dto.report;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DetailExcelReport {
    private Long dailyServing;
    private Long dailyBooked;
    private LocalDate reportedDate;
    private Double fillrate;
    private Double revenue;
    private Long noShow;
    private Long completed;
    private Long totalTables;
    private Long totaloccupied;

    public Double getNoShowRate() {
        if (completed == null || completed == 0L) {
            return 0.0;
        }
        return Math.round((noShow == null ? 0L : noShow) * 10000.0 / completed) / 100.0;
    }
}
