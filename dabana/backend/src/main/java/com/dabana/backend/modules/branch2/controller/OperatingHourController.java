package com.dabana.backend.modules.branch2.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.branch2.dto.OperatingHourDto;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.service.OperatingHourService;
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
    public ResponseEntity<ApiResponse<Void>> saveOperatingHours(@RequestBody List<OperatingHourDto> request, @PathVariable Long branchId) {
        operatingHourService.saveOperatingHours(branchId, request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, null));
    }
    @GetMapping("/{branchId}")
    public ResponseEntity<ApiResponse<List<OperatingHourDto>>> getOperatingHours(@PathVariable Long branchId) {
        List<OperatingHourDto> response = operatingHourService.getByBranch(branchId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, response));
    }

}
