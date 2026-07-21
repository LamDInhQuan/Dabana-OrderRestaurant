package com.dabana.backend.modules.extraorder.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.BaseController;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.extraorder.dto.request.AddExtraOrderRequest;
import com.dabana.backend.modules.extraorder.dto.request.UpdateExtraOrderQuantityRequest;
import com.dabana.backend.modules.extraorder.dto.response.ExtraOrderResponse;
import com.dabana.backend.modules.extraorder.service.IExtraOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * /api/extra-orders - Tab Goi mon, task 3: quan ly mon goi them (rs_extra_orders).
 * Cac endpoint nay danh cho nhan vien (Partner Portal), can dang nhap de lay
 * duoc nguoi thuc hien (recorded_by_user_id) qua BaseController#getCurrentUser().
 */
@RestController
@RequestMapping("/api/extra-orders")
@RequiredArgsConstructor
public class ExtraOrderController extends BaseController {

    private final IExtraOrderService extraOrderService;

    /** Liet ke mon goi them cua 1 booking - dung cho man hinh chi tiet ban ben Tab Goi mon. */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<List<ExtraOrderResponse>>> getByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                extraOrderService.getByBooking(bookingId)));
    }

    /** Them 1 dong mon goi them cho booking dang CHECKED_IN. */
    @PostMapping
    public ResponseEntity<ApiResponse<ExtraOrderResponse>> addItem(@Valid @RequestBody AddExtraOrderRequest request) {
        User user = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED,
                extraOrderService.addItem(request, user)));
    }

    /** Sua so luong 1 dong mon goi them da ghi nhan. */
    @PatchMapping("/{extraOrderId}/quantity")
    public ResponseEntity<ApiResponse<ExtraOrderResponse>> updateQuantity(
            @PathVariable Long extraOrderId,
            @Valid @RequestBody UpdateExtraOrderQuantityRequest request) {
        User user = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED,
                extraOrderService.updateQuantity(extraOrderId, request, user)));
    }

    /** Xoa han 1 dong mon goi them. */
    @DeleteMapping("/{extraOrderId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteItem(@PathVariable Long extraOrderId) {
        extraOrderService.deleteItem(extraOrderId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }
}