package com.dabana.backend.modules.subscription.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionPlanResponse;
import com.dabana.backend.modules.subscription.service.ISubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Cong khai - dung cho trang "Bang gia" cua Dabana, khong yeu cau dang nhap. */
@RestController
@RequestMapping("/api/subscription-plans")
@RequiredArgsConstructor
public class SubscriptionPlanController {

    private final ISubscriptionPlanService subscriptionPlanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> listActivePlans() {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionPlanService.listActivePlans()));
    }
}
