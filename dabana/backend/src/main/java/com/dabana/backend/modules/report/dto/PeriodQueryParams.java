package com.dabana.backend.modules.report.dto;

import com.dabana.backend.modules.report.util.ReportPeriod;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request DTO dùng chung cho MỌI endpoint report (Admin lẫn Partner).
 * Dùng {@code @ModelAttribute} để bind query param.
 */
@Data
public class PeriodQueryParams {
    private ReportPeriod period = ReportPeriod.MONTH; // DAY/MONTH/QUARTER/YEAR/CUSTOM
    private Integer year;                             // dùng cho MONTH/QUARTER/YEAR
    private Integer month;                            // 1-12, dùng cho MONTH
    private Integer quarter;                           // 1-4, dùng cho QUARTER
    private LocalDate date;                            // dùng cho DAY
    private LocalDate from;                             // dùng cho CUSTOM
    private LocalDate to;                               // dùng cho CUSTOM
    private Boolean compareWithPrevious = false;        // có trả kèm kỳ trước không
}
