package com.dabana.backend.modules.report.partner.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.BaseController;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.report.dto.PeriodQueryParams;
import com.dabana.backend.modules.report.partner.dto.PartnerDepositReportResponse;
import com.dabana.backend.modules.report.partner.dto.PartnerReservationReportResponse;
import com.dabana.backend.modules.report.partner.dto.PartnerRevenueReportResponse;
import com.dabana.backend.modules.report.partner.dto.PeakHourResponse;
import com.dabana.backend.modules.report.partner.service.PartnerReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Bao cao thong ke cho chu nha hang (RESTAURANT_PARTNER). Da duoc bao mat boi
 * SecurityConfig cho /api/restaurants/me/**. Scope theo owner qua guard trong service.
 */
@RestController
@RequestMapping("/api/restaurants/me/reports")
@RequiredArgsConstructor
public class PartnerReportController extends BaseController {

    private final PartnerReportService service;

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<PartnerRevenueReportResponse>> revenue(
            @RequestParam(required = false) Long branchId, PeriodQueryParams params) {
        User owner = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.SUCCESS, service.revenue(owner.getId(), branchId, params)));
    }

    @GetMapping("/deposits")
    public ResponseEntity<ApiResponse<PartnerDepositReportResponse>> deposits(
            @RequestParam(required = false) Long branchId, PeriodQueryParams params) {
        User owner = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.SUCCESS, service.deposits(owner.getId(), branchId, params)));
    }

    @GetMapping("/reservations")
    public ResponseEntity<ApiResponse<PartnerReservationReportResponse>> reservations(
            @RequestParam(required = false) Long branchId, PeriodQueryParams params) {
        User owner = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.SUCCESS, service.reservations(owner.getId(), branchId, params)));
    }

    @GetMapping("/reservations/peak-hours")
    public ResponseEntity<ApiResponse<PeakHourResponse>> peakHours(
            @RequestParam(required = false) Long branchId, PeriodQueryParams params) {
        User owner = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.SUCCESS, service.peakHours(owner.getId(), branchId, params)));
    }
}
