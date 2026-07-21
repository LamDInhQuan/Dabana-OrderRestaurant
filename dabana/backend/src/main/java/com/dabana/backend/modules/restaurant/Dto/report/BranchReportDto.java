package com.dabana.backend.modules.restaurant.Dto.report;

import java.util.List;

import lombok.Builder;
import lombok.Data;

/**
 * báo cáo của chi nhánh
 * 
 */
@Data
@Builder
public class BranchReportDto {

    // private List<PerDayReport> perDayReports;

    private Long branchId;
    private String branchName;

    private Long TodayBooking;
    private Long TotalServing;
    private Long TotalBooked;
    private Long TotalWait;
    private double totalReviewScore;
    private double fillRate;
    private double no_showRate30Day;
    private double totalRating;
}
