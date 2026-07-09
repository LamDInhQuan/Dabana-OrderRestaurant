package com.dabana.backend.modules.diningtable.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.diningtable.dto.request.BulkUpdateDiningTablePositionsRequest;
import com.dabana.backend.modules.diningtable.dto.request.CreateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.service.IDiningTableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dining-tables")
@RequiredArgsConstructor
public class DiningTableController {

    private final IDiningTableService diningTableService;

    @PostMapping
    public ResponseEntity<ApiResponse<DiningTableResponse>> createDiningTable(@Valid @RequestBody CreateDiningTableRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, diningTableService.createDiningTable(request)));
    }

    @PutMapping("/{tableId}")
    public ResponseEntity<ApiResponse<DiningTableResponse>> updateDiningTable(@PathVariable Long tableId,
                                                                              @Valid @RequestBody UpdateDiningTableRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, diningTableService.updateDiningTable(tableId, request)));
    }

    @PutMapping("/positions")
    public ResponseEntity<ApiResponse<List<DiningTableResponse>>> bulkUpdatePositions(@Valid @RequestBody BulkUpdateDiningTablePositionsRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, diningTableService.bulkUpdatePositions(request)));
    }

    @DeleteMapping("/{tableId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteDiningTable(@PathVariable Long tableId) {
        diningTableService.deleteDiningTable(tableId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }
}