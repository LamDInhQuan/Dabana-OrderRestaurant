package com.dabana.backend.modules.admin.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.admin.dto.CancellationGracePeriodDto;
import com.dabana.backend.modules.admin.dto.RestaurantCancellationLeadTimePolicyDto;
import com.dabana.backend.modules.admin.service.ISystemPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller quan ly va cong khai chinh sach chung toan he thong (Dabana Platform Policy).
 */
@RestController
@RequiredArgsConstructor
public class SystemPolicyController {

    private final ISystemPolicyService systemPolicyService;

    /**
     * Public API: Khach hang, Nha hang doi tac va Admin deu co the doc chinh sach an han huy don.
     */
    @GetMapping("/api/system-policies/cancellation-grace-period")
    public ResponseEntity<ApiResponse<CancellationGracePeriodDto>> getCancellationGracePeriod() {
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.SUCCESS,
                systemPolicyService.getCancellationGracePeriodPolicy()
        ));
    }

    /**
     * Admin API: Chi Quan tri vien moi co quyen thay doi cau hinh chinh sach he thong.
     */
    @PutMapping("/api/admin/system-policies/cancellation-grace-period")
    public ResponseEntity<ApiResponse<CancellationGracePeriodDto>> updateCancellationGracePeriod(
            @Valid @RequestBody CancellationGracePeriodDto request
    ) {
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.UPDATED,
                systemPolicyService.updateCancellationGracePeriodPolicy(request)
        ));
    }

    /**
     * Public API: Khach hang, Nha hang doi tac va Admin deu co the doc quy dinh thoi gian nha hang duoc huy don.
     */
    @GetMapping("/api/system-policies/restaurant-cancellation-lead-time")
    public ResponseEntity<ApiResponse<RestaurantCancellationLeadTimePolicyDto>> getRestaurantCancellationLeadTime() {
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.SUCCESS,
                systemPolicyService.getRestaurantCancellationLeadTimePolicy()
        ));
    }

    /**
     * Admin API: Quan tri vien thay doi cau hinh quy dinh thoi gian nha hang duoc huy don.
     */
    @PutMapping("/api/admin/system-policies/restaurant-cancellation-lead-time")
    public ResponseEntity<ApiResponse<RestaurantCancellationLeadTimePolicyDto>> updateRestaurantCancellationLeadTime(
            @Valid @RequestBody RestaurantCancellationLeadTimePolicyDto request
    ) {
        return ResponseEntity.ok(ResponseBuilder.success(
                SuccessCode.UPDATED,
                systemPolicyService.updateRestaurantCancellationLeadTimePolicy(request)
        ));
    }
}

