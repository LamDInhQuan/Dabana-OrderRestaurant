package com.dabana.backend.modules.diningtable.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.diningtable.dto.request.BulkUpdateDiningTablePositionsRequest;
import com.dabana.backend.modules.diningtable.dto.request.CreateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableStatusRequest;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.dto.response.TableAvailabilityResponse;
import com.dabana.backend.modules.diningtable.service.DiningTableAvailabilityService;
import com.dabana.backend.modules.diningtable.service.IDiningTableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/dining-tables")
@RequiredArgsConstructor
public class DiningTableController {

    private final IDiningTableService diningTableService;
    private final DiningTableAvailabilityService diningTableAvailabilityService ;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DiningTableResponse>>> getTablesByBranchAndZone(
            @RequestParam Long branchId,
            @RequestParam(required = false) Long zoneId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                diningTableService.getTablesByBranchAndZone(branchId, zoneId)));
    }

    @GetMapping("/{branchId}")
    public ResponseEntity<ApiResponse<List<DiningTableResponse>>> getTablesByBranchId(@PathVariable Long branchId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                diningTableService.getTablesByBranchId(branchId)));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<DiningTableResponse>> createDiningTable(@Valid @RequestBody CreateDiningTableRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, diningTableService.createDiningTable(request)));
    }

    @PutMapping("/update/{tableId}")
    public ResponseEntity<ApiResponse<DiningTableResponse>> updateDiningTable(@PathVariable Long tableId,
                                                                              @Valid @RequestBody UpdateDiningTableRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, diningTableService.updateDiningTable(tableId, request)));
    }

    // Doi trang thai ban THU CONG boi nhan vien tren Tab Goi mon (chi EMPTY/CLEANING/MAINTENANCE).
    // RESERVED/OCCUPIED khong duoc set o day - do BookingService tu dong dong bo.
    @PatchMapping("/{tableId}/status")
    public ResponseEntity<ApiResponse<DiningTableResponse>> updateStatusManually(
            @PathVariable Long tableId, @Valid @RequestBody UpdateDiningTableStatusRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED,
                diningTableService.updateStatusManually(tableId, request)));
    }

    @PutMapping("/positions")
    public ResponseEntity<ApiResponse<List<DiningTableResponse>>> bulkUpdatePositions(@Valid @RequestBody BulkUpdateDiningTablePositionsRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, diningTableService.bulkUpdatePositions(request)));
    }

    @DeleteMapping("/delete/{tableId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteDiningTable(@PathVariable Long tableId) {
        diningTableService.deleteDiningTable(tableId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }

    // available table
    @GetMapping("/available-tables")
    public ResponseEntity<ApiResponse<List<TableAvailabilityResponse>>> getAvailableTables(
            @RequestParam("branchId") Long branchId,
            @RequestParam("zoneId") Long zoneId,
            @RequestParam("reservationTime")  @DateTimeFormat(pattern = "dd-MM-yyyy HH:mm") LocalDateTime reservationTime) {

        List<TableAvailabilityResponse> tables = diningTableAvailabilityService.getAvailability(branchId,zoneId , reservationTime);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, tables));
    }
}