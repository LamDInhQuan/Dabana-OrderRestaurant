package com.dabana.backend.modules.admin.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.dabana.backend.modules.admin.dto.AdminReport;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.auth.util.AccountStatus;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.review.ReviewRepository;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.repository.SubscriptionInvoiceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final SubscriptionInvoiceRepository subscriptionInvoiceRepository;
    

    public AdminReport dashboard() {
        Long totalUsers = userRepository.countByStatus(AccountStatus.ACTIVE.getStatus());
        double totalRevenue = subscriptionInvoiceRepository
                .findByStatusInOrderByCreatedAtDesc(List.of(InvoiceStatus.PAID)).stream()
                .mapToDouble(invoice -> invoice.getAmount().doubleValue())
                .sum();

        totalRevenue = Math.round(totalRevenue * 100.0) / 100.0; // Round to 2 decimal places
        Long totalRestaurants = restaurantRepository.count();
        Long totalBranches = branchRepository.count();
        Long totalBookings = bookingRepository.count();
        Long totalNoShow = bookingRepository.countByStatus(BookingStatus.NO_SHOW);
        Long totalFinishedBookings = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        Long hiddenReviews = reviewRepository.countByHidden(true);

        Long totalReviews = reviewRepository.count();

        Long pendingUserApprovals = userRepository.countByStatus(AccountStatus.PENDING_OTP.getStatus());
        Long pendingRestaurantApprovals = restaurantRepository.countByApprovalStatus(ApprovalStatus.PENDING);
        Long pendingBranchApprovals = branchRepository.countByStatus(BranchStatus.PENDING.getStatus());

        return AdminReport.builder()
                .totalUsers(totalUsers)
                .totalRevenue(totalRevenue)
                .totalRestaurants(totalRestaurants)
                .totalBranches(totalBranches)
                .totalBookings(totalBookings)
                .totalNoShow(totalNoShow)
                .totalReviews(totalReviews)
                .hiddenReviews(hiddenReviews)
                .pendingUserApprovals(pendingUserApprovals)
                .pendingRestaurantApprovals(pendingRestaurantApprovals)
                .pendingBranchApprovals(pendingBranchApprovals)
                .totalfinishedBookings(totalFinishedBookings)
                .build();
    }
    
    
    
    
    
}
