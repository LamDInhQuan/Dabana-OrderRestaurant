package com.dabana.backend.modules.booking;

import com.dabana.backend.common.BaseController;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.dto.BookingDtos.*;
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
    private final CurrentUserProvider currentUserProvider;

    /** Buoc 3 (+ AF01): tao yeu cau giu ban tam thoi */
    @PostMapping("/hold")
    public ResponseEntity<BookingResponse> createHold(@Valid @RequestBody CreateHoldRequest request) {
        User user = getCurrentUser();
        return ResponseEntity.ok(bookingService.createHold(user, request));
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
