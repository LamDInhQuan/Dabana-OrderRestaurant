package com.dabana.backend.modules.branch2.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.branch2.dto.OperatingPeriod;
import com.dabana.backend.modules.branch2.dto.request.BranchScheduleExceptionRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.service.AvailableSlotService;
import com.dabana.backend.modules.branch2.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/branches//available-slot")
@RequiredArgsConstructor
public class AvailableSlotController {

    private final AvailableSlotService availableSlotService;

    @GetMapping("/get-shifts")
    public ResponseEntity<ApiResponse<List<OperatingPeriod>>> getShiftsByTargetDay(@RequestParam Long branchId,
                                                                                   @RequestParam LocalDate date) {
        List<OperatingPeriod> responses = availableSlotService.getEffectiveOperatingPeriods(branchId, date);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, responses));
    }


}
