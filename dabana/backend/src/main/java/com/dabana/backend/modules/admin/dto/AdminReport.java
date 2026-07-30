package com.dabana.backend.modules.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminReport {
    private Long totalUsers;
    private double totalRevenue;
    private Long totalRestaurants;
    private Long totalBranches;
    private Long totalReviews;

    private Long hiddenReviews;
    
    private Long totalBookings;
    private Long totalNoShow;
    private Long totalfinishedBookings;
    
    private Long totalParners;

    private Long pendingUserApprovals;
    private Long pendingRestaurantApprovals;
    private Long pendingBranchApprovals;
}
