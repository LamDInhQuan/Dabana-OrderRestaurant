package com.dabana.backend.modules.booking;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.BaseController;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.auth.util.OtpPurpose;
import com.dabana.backend.modules.booking.dto.BookingDtos.*;
import com.dabana.backend.modules.booking.dto.request.GuestLookupRequest;
import com.dabana.backend.security.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * /api/bookings - trien khai B01 (dat ban truc tuyen) theo dung trinh tu
 * Buoc 3 -> 4 -> 5 -> 6/7 -> 8 -> 9/10 cua dac ta.
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController extends BaseController {

    private final BookingService bookingService;
    private final OtpService otpService ;

    /** Buoc 3 (+ AF01): tao yeu cau giu ban tam thoi */
    @PostMapping("/hold")
    public ResponseEntity<ApiResponse<BookingResponse>> createHold(@Valid @RequestBody CreateHoldRequest request) {
        User user = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, bookingService.createHold(user,request)));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings() {
        User user = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, bookingService.getMyBookings(user)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getById(@PathVariable Long id) {
        User user = getCurrentUser();
        BookingResponse response = bookingService.getBookingDetail(id, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/guest-lookup")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getGuestBookings(
            @Valid @RequestBody GuestLookupRequest request) {
        // 1. Xác thực tính hợp lệ của OTP với mục đích "GUEST_LOOKUP"
        boolean isValidOtp = otpService.verify(request.getEmail(), request.getOtp(), OtpPurpose.GUEST_LOOKUP);
        if (!isValidOtp) {
            throw new BusinessException(AuthErrorCode.OTP_INVALID);
        }
        // 2. Sau khi OTP đúng, truy vấn danh sách đặt bàn theo email
        List<BookingResponse> bookings = bookingService.getBookingsByEmail(request.getEmail());

        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, bookings));
    }
//    /** Buoc 4: cap nhat thong tin lien he */
//    @PatchMapping("/{id}/contact-info")
//    public ResponseEntity<BookingResponse> updateContactInfo(
//            @PathVariable Long id, @Valid @RequestBody ContactInfoRequest request) {
//        Long customerId = currentUserProvider.getCurrentUserId();
//        return ResponseEntity.ok(bookingService.updateContactInfo(id, customerId, request));
//    }
//
//    /** Buoc 5 (+ AF02 neu bo qua): dat mon truoc */
//    @PostMapping("/{id}/pre-order")
//    public ResponseEntity<BookingResponse> addPreOrder(
//            @PathVariable Long id, @RequestBody PreOrderRequest request) {
//        Long customerId = currentUserProvider.getCurrentUserId();
//        return ResponseEntity.ok(bookingService.addPreOrderItems(id, customerId, request));
//    }
//
//    /** Buoc 8: ket qua thanh toan tu cong thanh toan (webhook noi bo goi sau khi nhan callback) */
//    @PostMapping("/{id}/payment-result")
//    public ResponseEntity<BookingResponse> paymentResult(
//            @PathVariable Long id, @Valid @RequestBody PaymentResultRequest request) {
//        return ResponseEntity.ok(bookingService.processPaymentResult(id, request));
//    }
//
//    /** AF03: xac nhan ngay khong can dat coc */
//    @PostMapping("/{id}/confirm-without-deposit")
//    public ResponseEntity<BookingResponse> confirmWithoutDeposit(@PathVariable Long id) {
//        Long customerId = currentUserProvider.getCurrentUserId();
//        return ResponseEntity.ok(bookingService.confirmWithoutDeposit(id, customerId));
//    }
}
