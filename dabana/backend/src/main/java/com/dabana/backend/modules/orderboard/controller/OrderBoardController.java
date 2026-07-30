package com.dabana.backend.modules.orderboard.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.orderboard.dto.response.BranchBoardResponse;
import com.dabana.backend.modules.orderboard.service.IOrderBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Tab Goi Mon - Task 4: danh sach ban + don hang realtime theo chi nhanh.
 * FE goi API nay de ve so do/ danh sach ban (nhom theo Zone), sau do lang
 * nghe them WebSocket (Task 5, se lam rieng) de cap nhat live khi co thay
 * doi trang thai ban / don hang.
 */
@RestController
@RequestMapping("/api/order-board")
@RequiredArgsConstructor
public class OrderBoardController {

    private final IOrderBoardService orderBoardService;

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<BranchBoardResponse>> getBoard(
            @PathVariable Long branchId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime targetTime) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                orderBoardService.getBoard(branchId, zoneId, targetTime)));
    }
}
