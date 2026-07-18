package com.dabana.backend.modules.branch2.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.BaseController;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.entity.User;
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
public class BranchController extends BaseController {

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

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getMyList() {
        // 1. Lấy thông tin User hiện tại từ SecurityContext thông qua BaseController
        User currentUser = getCurrentUser();
        // 2. Gọi Service xử lý lấy danh sách theo User ID
        List<BranchResponse> responses = branchService.findBranchesByManager(currentUser.getId());
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, responses));
    }

    //    // 1. LẤY TẤT CẢ CHI NHÁNH
//    @GetMapping
//    public ResponseEntity<List<BranchResponse>> getAllBranches() {
//        List<BranchResponse> responses = branchService.findAll().stream()
//                .map(this::convertToResponse)
//                .collect(Collectors.toList());
//        return ResponseEntity.ok(responses);
//    }
//
    // 2. LẤY CHI NHÁNH THEO ID
    @GetMapping("/{id}")
    public ResponseEntity<BranchResponse> getBranchById(@PathVariable Long id) {
        // Service sẽ xử lý việc tìm kiếm và convert, Controller chỉ việc trả về
        BranchResponse response = branchService.findById(id);
        return ResponseEntity.ok(response);
    }

    // 3. TẠO MỚI CHI NHÁNH
    @PostMapping
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(@Valid @RequestBody BranchRequest request) {
        BranchResponse branchResponse = branchService.create(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, branchResponse));
    }

//    // 4. CẬP NHẬT (MERGE ĐÈ HOÀN TOÀN)
//    @PutMapping("/{id}")
//    public ResponseEntity<BranchResponse> updateBranch(
//            @PathVariable Long id,
//            @Valid @RequestBody BranchRequest request) {
//
//        Branch newBranchData = convertToEntity(request);
//        Branch updatedBranch = branchService.update(id, newBranchData);
//        return ResponseEntity.ok(convertToResponse(updatedBranch));
//    }
//
//    // 5. XÓA CHI NHÁNH
//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
//        branchService.delete(id);
//        return ResponseEntity.noContent().build();
//    }


}
