package com.dabana.backend.modules.reservation_policy.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.menu.dto.request.*;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyResponse;
import com.dabana.backend.modules.reservation_policy.service.ReservationPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/reservation-policies")
@RequiredArgsConstructor
public class ReservationPolicyController {

    private final ReservationPolicyService reservationPolicyService;

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
    public ResponseEntity<ApiResponse<ReservationPolicyResponse>> getDetail(@PathVariable Long restaurantId, @PathVariable Long policyId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, reservationPolicyService.getDetail(restaurantId, policyId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationPolicyResponse>>> getAll(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, reservationPolicyService.getAll(restaurantId)));
    }

}