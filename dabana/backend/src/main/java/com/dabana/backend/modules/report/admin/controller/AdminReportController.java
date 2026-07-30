package com.dabana.backend.modules.report.admin.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.report.admin.dto.*;
import com.dabana.backend.modules.report.admin.service.AdminReportService;
import com.dabana.backend.modules.report.dto.PeriodQueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint Thống kê & Báo cáo phía ADMIN.
 * /api/admin/** đã được SecurityConfig chốt role ADMIN.
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminReportService service;

    @GetMapping("/subscriptions")
    public ResponseEntity<ApiResponse<AdminSubscriptionReportResponse>> subscriptions(PeriodQueryParams params) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, service.buildSubscriptionReport(params)));
    }

    @GetMapping("/restaurants")
    public ResponseEntity<ApiResponse<AdminRestaurantReportResponse>> restaurants(PeriodQueryParams params) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, service.buildRestaurantReport(params)));
    }

    @GetMapping("/reservations")
    public ResponseEntity<ApiResponse<AdminReservationReportResponse>> reservations(PeriodQueryParams params) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, service.buildReservationReport(params)));
    }

    @GetMapping("/deposits")
    public ResponseEntity<ApiResponse<AdminDepositReportResponse>> deposits(PeriodQueryParams params) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, service.buildDepositReport(params)));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserReportResponse>> users(PeriodQueryParams params) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, service.buildUserReport(params)));
    }
}
