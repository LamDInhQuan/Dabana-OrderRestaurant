package com.dabana.backend.modules.booking.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.booking.dto.request.UpdateBookingItemQuantityRequest;
import com.dabana.backend.modules.booking.dto.response.PreorderItemResponse;
import com.dabana.backend.modules.booking.service.IBookingItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * /api/preorder-items - Tab Goi mon: quan ly mon dat truoc (rs_preorder_items).
 * Tach rieng khoi BookingController (chi lo vong doi Booking: hold/check-in/
 * check-out/no-show/cancel) de khong phai dung cham vao file do; cung dang
 * REST voi ExtraOrderController (/api/extra-orders) cho mon goi them, giup
 * FE dung 1 bo UI (Unified Order) cho ca 2 loai mon.
 */
@RestController
@RequestMapping("/api/preorder-items")
@RequiredArgsConstructor
public class PreorderItemController {

    private final IBookingItemService bookingItemService;

    /** Liet ke mon dat truoc cua 1 booking - dung cho man hinh chi tiet ban ben Tab Goi mon. */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<List<PreorderItemResponse>>> getByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                bookingItemService.getByBooking(bookingId)));
    }

    /** Sua so luong 1 dong mon dat truoc (chi khi booking dang CONFIRMED/CHECKED_IN). */
    @PatchMapping("/{itemId}/quantity")
    public ResponseEntity<ApiResponse<PreorderItemResponse>> updateQuantity(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateBookingItemQuantityRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED,
                bookingItemService.updateQuantity(itemId, request)));
    }

    /** Xoa han 1 dong mon dat truoc (chi khi booking dang CONFIRMED/CHECKED_IN). */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteItem(@PathVariable Long itemId) {
        bookingItemService.deleteItem(itemId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }
}