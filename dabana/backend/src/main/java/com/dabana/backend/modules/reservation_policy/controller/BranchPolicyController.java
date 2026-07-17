package com.dabana.backend.modules.reservation_policy.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.reservation_policy.dto.request.AssignBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDepositRuleResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyScheduleResponse;
import com.dabana.backend.modules.reservation_policy.service.IBranchPolicyDepositRuleService;
import com.dabana.backend.modules.reservation_policy.service.IBranchPolicyScheduleService;
import com.dabana.backend.modules.reservation_policy.service.IBranchPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches/{branchId}/policies")
@RequiredArgsConstructor
public class BranchPolicyController {

    private final IBranchPolicyService branchPolicyService;
    private final IBranchPolicyDepositRuleService branchPolicyDepositRuleService;
    private final IBranchPolicyScheduleService branchPolicyScheduleService;

    @PostMapping
    public ResponseEntity<ApiResponse<BranchPolicyResponse>> create(
            @PathVariable Long branchId,
            @Valid @RequestBody AssignBranchPolicyRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, branchPolicyService.create(branchId, request)));
    }

    @PutMapping("/{branchPolicyId}")
    public ResponseEntity<ApiResponse<BranchPolicyResponse>> update(
            @PathVariable Long branchId,
            @PathVariable Long branchPolicyId,
            @Valid @RequestBody UpdateBranchPolicyRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, branchPolicyService.update(branchId, branchPolicyId, request)));
    }

    @DeleteMapping("/{branchPolicyId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long branchId, @PathVariable Long branchPolicyId) {
        branchPolicyService.delete(branchId, branchPolicyId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, null));
    }

    @GetMapping("/{branchPolicyId}")
    public ResponseEntity<ApiResponse<BranchPolicyDetailResponse>> getDetail(@PathVariable Long branchId, @PathVariable Long branchPolicyId){
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, branchPolicyService.getDetail(branchId, branchPolicyId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BranchPolicyResponse>>> getAll(@PathVariable Long branchId){
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, branchPolicyService.getAll(branchId)));
    }

    @PostMapping("/{branchPolicyId}/deposit-rules")
    public ResponseEntity<ApiResponse<BranchPolicyDepositRuleResponse>> createDepositRule(
            @PathVariable Long branchId,
            @PathVariable Long branchPolicyId,
            @Valid @RequestBody CreateBranchPolicyDepositRuleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                branchPolicyDepositRuleService.create(branchId, branchPolicyId, request)));
    }

    @PutMapping("/{branchPolicyId}/deposit-rules/{ruleId}")
    public ResponseEntity<ApiResponse<BranchPolicyDepositRuleResponse>> updateDepositRule(
            @PathVariable Long branchId,
            @PathVariable Long branchPolicyId,
            @PathVariable Long ruleId,
            @Valid @RequestBody UpdateBranchPolicyDepositRuleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                branchPolicyDepositRuleService.update(branchId, branchPolicyId, ruleId, request)));
    }

    @DeleteMapping("/{branchPolicyId}/deposit-rules/{ruleId}")
    public ResponseEntity<ApiResponse<Void>> deleteDepositRule(
            @PathVariable Long branchId,
            @PathVariable Long branchPolicyId,
            @PathVariable Long ruleId) {
        branchPolicyDepositRuleService.delete(branchId, branchPolicyId, ruleId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, null));
    }

//    @GetMapping("/{branchPolicyId}/deposit-rules/{ruleId}")
//    public ResponseEntity<ApiResponse<BranchPolicyDepositRuleResponse>> getDetailDepositRule(
//            @PathVariable Long branchId,
//            @PathVariable Long branchPolicyId,
//            @PathVariable Long ruleId) {
//        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
//                branchPolicyDepositRuleService.getDetail(branchId, branchPolicyId, ruleId)));
//    }

//    @GetMapping("/{branchPolicyId}/deposit-rules")
//    public ResponseEntity<ApiResponse<List<BranchPolicyDepositRuleResponse>>> getAllDepositRules(
//            @PathVariable Long branchId,
//            @PathVariable Long branchPolicyId) {
//        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
//                branchPolicyDepositRuleService.getAll(branchId, branchPolicyId)));
//    }

    @PostMapping("/{branchPolicyId}/schedules")
    public ResponseEntity<ApiResponse<BranchPolicyScheduleResponse>> createSchedule(
            @PathVariable Long branchId,
            @PathVariable Long branchPolicyId,
            @Valid @RequestBody CreateBranchPolicyScheduleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                branchPolicyScheduleService.create(branchId, branchPolicyId, request)));
    }

    @PutMapping("/{branchPolicyId}/schedules/{scheduleId}")
    public ResponseEntity<ApiResponse<BranchPolicyScheduleResponse>> updateSchedule(
            @PathVariable Long branchId,
            @PathVariable Long branchPolicyId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody UpdateBranchPolicyScheduleRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                branchPolicyScheduleService.update(branchId, branchPolicyId, scheduleId, request)));
    }

    @DeleteMapping("/{branchPolicyId}/schedules/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(
            @PathVariable Long branchId,
            @PathVariable Long branchPolicyId,
            @PathVariable Long scheduleId) {
        branchPolicyScheduleService.delete(branchId, branchPolicyId, scheduleId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, null));
    }

//    @GetMapping("/{branchPolicyId}/schedules/{scheduleId}")
//    public ResponseEntity<ApiResponse<BranchPolicyScheduleResponse>> getDetailSchedule(
//            @PathVariable Long branchId,
//            @PathVariable Long branchPolicyId,
//            @PathVariable Long scheduleId) {
//        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
//                branchPolicyScheduleService.getDetail(branchId, branchPolicyId, scheduleId)));
//    }
//
//    @GetMapping("/{branchPolicyId}/schedules")
//    public ResponseEntity<ApiResponse<List<BranchPolicyScheduleResponse>>> getAllSchedules(
//            @PathVariable Long branchId,
//            @PathVariable Long branchPolicyId) {
//        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
//                branchPolicyScheduleService.getAll(branchId, branchPolicyId)));
//    }

}