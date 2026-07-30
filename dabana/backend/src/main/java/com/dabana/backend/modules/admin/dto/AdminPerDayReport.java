package com.dabana.backend.modules.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminPerDayReport {

    private Long totalUsers;
    private Long totalRestaurants;
    private Double totalRevenue;
    private Long totalBranches;
    private Long totalReviews;

    private Long totalBookings;
    private Long totalNoShow;

}
