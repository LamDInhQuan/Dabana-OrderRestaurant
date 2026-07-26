package com.dabana.backend.modules.subscription.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.subscription.dto.request.CreateSubscriptionPlanRequest;
import com.dabana.backend.modules.subscription.dto.request.UpdateSubscriptionPlanRequest;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionPlanResponse;
import com.dabana.backend.modules.subscription.service.ISubscriptionPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Chi ADMIN - CRUD cau hinh goi dich vu. Phan quyen dat trong SecurityConfig (/api/admin/**). */
@RestController
@RequestMapping("/api/admin/subscription-plans")
@RequiredArgsConstructor
public class SubscriptionPlanAdminController {

    private final ISubscriptionPlanService subscriptionPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> listAllPlans() {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionPlanService.listAllPlans()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> createPlan(
            @Valid @RequestBody CreateSubscriptionPlanRequest request
    ) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED,
                subscriptionPlanService.createPlan(request)));
    }

    @PutMapping("/{planId}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> updatePlan(
            @PathVariable Long planId,
            @Valid @RequestBody UpdateSubscriptionPlanRequest request
    ) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED,
                subscriptionPlanService.updatePlan(planId, request)));
    }
}
