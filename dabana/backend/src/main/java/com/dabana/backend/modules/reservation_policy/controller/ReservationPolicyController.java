package com.dabana.backend.modules.reservation_policy.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDepositRuleResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyScheduleResponse;
import com.dabana.backend.modules.reservation_policy.service.IReservationPolicyDepositRuleService;
import com.dabana.backend.modules.reservation_policy.service.IReservationPolicyScheduleService;
import com.dabana.backend.modules.reservation_policy.service.IReservationPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/reservation-policies")
@RequiredArgsConstructor
public class ReservationPolicyController {

    private final IReservationPolicyService reservationPolicyService;
    private final IReservationPolicyDepositRuleService reservationPolicyDepositRuleService;
    private final IReservationPolicyScheduleService reservationPolicyScheduleService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationPolicyResponse>> create(@PathVariable Long restaurantId, @Valid @RequestBody CreateReservationPolicyRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, reservationPolicyService.create(restaurantId, request)));
    }

    @PutMapping("/{policyId}")
    public ResponseEntity<ApiResponse<ReservationPolicyResponse>> update(@PathVariable Long restaurantId, @PathVariable Long policyId, @Valid @RequestBody UpdateReservationPolicyRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, reservationPolicyService.update(restaurantId, policyId, request)));
    }

    @DeleteMapping("/{policyId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long restaurantId, @PathVariable Long policyId) {
        reservationPolicyService.delete(restaurantId, policyId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, null));
    }

    @GetMapping("/{policyId}")
    public ResponseEntity<ApiResponse<ReservationPolicyDetailResponse>> getDetail(@PathVariable Long restaurantId, @PathVariable Long policyId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, reservationPolicyService.getDetail(restaurantId, policyId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationPolicyResponse>>> getAll(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, reservationPolicyService.getAll(restaurantId)));
    }

    @PostMapping("/{policyId}/deposit-rules")
    public ResponseEntity<ApiResponse<ReservationPolicyDepositRuleResponse>> createDepositRule(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId,
            @Valid @RequestBody CreateReservationPolicyDepositRuleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reservationPolicyDepositRuleService.create(restaurantId, policyId, request)));
    }

    @PutMapping("/{policyId}/deposit-rules/{ruleId}")
    public ResponseEntity<ApiResponse<ReservationPolicyDepositRuleResponse>> updateDepositRule(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId,
            @PathVariable Long ruleId,
            @Valid @RequestBody UpdateReservationPolicyDepositRuleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reservationPolicyDepositRuleService.update(restaurantId, policyId, ruleId, request)));
    }

    @DeleteMapping("/{policyId}/deposit-rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deleteDepositRule(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId,
            @PathVariable Long ruleId) {
        reservationPolicyDepositRuleService.delete(restaurantId, policyId, ruleId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, null));
    }

//    @GetMapping("/{policyId}/deposit-rules/{ruleId}")
//    public ResponseEntity<ApiResponse<ReservationPolicyDepositRuleResponse>> getDetailDepositRule(
//            @PathVariable Long restaurantId,
//            @PathVariable Long policyId,
//            @PathVariable Long ruleId) {
//        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
//                reservationPolicyDepositRuleService.getDetail(restaurantId, policyId, ruleId)));
//    }

    @GetMapping("/{policyId}/deposit-rules")
    public ResponseEntity<ApiResponse<List<ReservationPolicyDepositRuleResponse>>> getAllDepositRules(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reservationPolicyDepositRuleService.getAll(restaurantId, policyId)));
    }

    @PostMapping("/{policyId}/schedules")
    public ResponseEntity<ApiResponse<ReservationPolicyScheduleResponse>> createSchedule(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId,
            @Valid @RequestBody CreateReservationPolicyScheduleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reservationPolicyScheduleService.create(restaurantId, policyId, request)));
    }

    @PutMapping("/{policyId}/schedules/{scheduleId}")
    public ResponseEntity<ApiResponse<ReservationPolicyScheduleResponse>> updateSchedule(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody UpdateReservationPolicyScheduleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reservationPolicyScheduleService.update(restaurantId, policyId, scheduleId, request)));
    }

    @DeleteMapping("/{policyId}/schedules/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId,
            @PathVariable Long scheduleId) {
        reservationPolicyScheduleService.delete(restaurantId, policyId, scheduleId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, null));
    }

//    @GetMapping("/{policyId}/schedules/{scheduleId}")
//    public ResponseEntity<ApiResponse<ReservationPolicyScheduleResponse>> getDetailSchedule(
//            @PathVariable Long restaurantId,
//            @PathVariable Long policyId,
//            @PathVariable Long scheduleId) {
//        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
//                reservationPolicyScheduleService.getDetail(restaurantId, policyId, scheduleId)));
//    }

    @GetMapping("/{policyId}/schedules")
    public ResponseEntity<ApiResponse<List<ReservationPolicyScheduleResponse>>> getAllSchedules(
            @PathVariable Long restaurantId,
            @PathVariable Long policyId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reservationPolicyScheduleService.getAll(restaurantId, policyId)));
    }

}