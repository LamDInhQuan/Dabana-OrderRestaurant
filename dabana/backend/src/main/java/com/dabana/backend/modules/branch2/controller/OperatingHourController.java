package com.dabana.backend.modules.branch2.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.branch2.dto.OperatingHourDto;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.service.OperatingHourService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branchs/operating-hours")
@RequiredArgsConstructor
public class OperatingHourController {
    private final OperatingHourService operatingHourService;

    @PostMapping("/branch/{branchId}/save")
    public ResponseEntity<ApiResponse<Void>> saveOperatingHours(@RequestBody @Valid List<OperatingHourDto> request, @PathVariable Long branchId) {
        operatingHourService.saveOperatingHours(branchId, request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, null));
    }
    @GetMapping("/{branchId}")
    public ResponseEntity<ApiResponse<List<OperatingHourDto>>> getOperatingHours(@PathVariable Long branchId) {
        List<OperatingHourDto> response = operatingHourService.getByBranch(branchId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, response));
    }
    // 2. Thêm mới một khung giờ cho chi nhánh
    @PostMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<OperatingHourDto>> createOperatingHour(
            @PathVariable Long branchId,
            @RequestBody OperatingHourDto request) {
        OperatingHourDto response = operatingHourService.createOperatingHour(branchId, request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, response));
    }

    // 3. Cập nhật một khung giờ cụ thể theo ID
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OperatingHourDto>> updateOperatingHour(
            @PathVariable Long id,
            @RequestBody @Valid OperatingHourDto request) {
        OperatingHourDto response = operatingHourService.updateOperatingHour(id, request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, response));
    }

    // 4. Xóa một khung giờ cụ thể theo ID
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOperatingHour(@PathVariable Long id) {
        operatingHourService.deleteOperatingHour(id);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, null));
    }
}
