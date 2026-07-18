package com.dabana.backend.modules.booking.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.booking.dto.BookingDtos.PreOrderRequest;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationConfirmResponse;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationDetailResponse;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationHoldRequest;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationHoldResponse;
import com.dabana.backend.modules.booking.service.BookingService;
import com.dabana.backend.security.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/hold")
    public ResponseEntity<ApiResponse<ReservationHoldResponse>> holdReservation(
            @Valid @RequestBody ReservationHoldRequest request) {
        Long currentUserId = currentUserProvider.getCurrentUserId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED,
                bookingService.holdReservation(currentUserId, request)));
    }

    @PostMapping("/{reservationId}/preorder")
    public ResponseEntity<ApiResponse<ReservationDetailResponse>> preorderItems(
            @PathVariable Long reservationId,
            @Valid @RequestBody PreOrderRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                bookingService.addPreOrderItems(reservationId, request)));
    }

    @PostMapping("/{reservationId}/confirm")
    public ResponseEntity<ApiResponse<ReservationConfirmResponse>> confirmReservation(
            @PathVariable Long reservationId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                bookingService.confirmReservation(reservationId)));
    }

    @PostMapping("/{reservationId}/deposit-payment")
    public ResponseEntity<ApiResponse<String>> depositPayment(@PathVariable Long reservationId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                "TODO: thanh toan coc qua pm_transactions"));
    }

    @PostMapping("/{reservationId}/cancel")
    public ResponseEntity<ApiResponse<String>> cancelReservation(@PathVariable Long reservationId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                "TODO: huy dat ban va xu ly hoan coc theo chinh sach"));
    }
}
