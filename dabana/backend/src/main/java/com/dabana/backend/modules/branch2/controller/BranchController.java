package com.dabana.backend.modules.branch2.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.service.AuthService;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * /api/auth - dang ky, dang nhap, lam moi token, quan ly phien dang nhap
 * cho ca ba vai tro (theo 3.6 thiet ke API).
 */
@RestController
@RequestMapping("/api/branchs")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping("/by-restaurant/{id}")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getAllBranchesByRestaurant(@PathVariable Long id) {
        List<BranchResponse> responses = branchService.findByRestaurant(id);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, responses));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getAllBranches() {
        List<BranchResponse> responses = branchService.findAll();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, responses));
    }

    // 2. LẤY CHI NHÁNH THEO ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BranchResponse>> getBranchById(@PathVariable Long id) {
        BranchResponse response = branchService.findById(id)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, response));
    }

    // 3. TẠO MỚI CHI NHÁNH
    @PostMapping
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(@Valid @RequestBody BranchRequest request) {
        BranchResponse branchResponse = branchService.create(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, branchResponse));
    }

}