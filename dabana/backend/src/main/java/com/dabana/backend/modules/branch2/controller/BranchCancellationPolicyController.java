package com.dabana.backend.modules.branch2.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.branch2.dto.request.BranchCancellationPolicyRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchCancellationPolicyResponse;
import com.dabana.backend.modules.branch2.service.IBranchCancellationPolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/branches/{branchId}/cancellation-policy")
public class BranchCancellationPolicyController {

    private final IBranchCancellationPolicyService branchCancellationPolicyService;

    @PostMapping
    public ResponseEntity<ApiResponse<BranchCancellationPolicyResponse>> create(
            @PathVariable Long branchId,
            @Valid @RequestBody BranchCancellationPolicyRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, branchCancellationPolicyService.create(branchId, request)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<BranchCancellationPolicyResponse>> update(
            @PathVariable Long branchId,
            @Valid @RequestBody BranchCancellationPolicyRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, branchCancellationPolicyService.update(branchId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BranchCancellationPolicyResponse>> get(
            @PathVariable Long branchId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, branchCancellationPolicyService.getByBranch(branchId)));
    }

}