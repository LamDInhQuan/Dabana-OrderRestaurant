package com.dabana.backend.modules.payment.controller;

import com.dabana.backend.modules.payment.dto.request.CancelDepositPaymentRequest;
import com.dabana.backend.modules.payment.dto.request.CreateDepositPaymentRequest;
import com.dabana.backend.modules.payment.dto.response.DepositPaymentResponse;
import com.dabana.backend.modules.payment.service.DepositPaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment/deposits")
public class DepositPaymentController {

    private final DepositPaymentService depositPaymentService;

    public DepositPaymentController(DepositPaymentService depositPaymentService) {
        this.depositPaymentService = depositPaymentService;
    }

    @PostMapping
    public DepositPaymentResponse create(@Valid @RequestBody CreateDepositPaymentRequest request) {
        return depositPaymentService.createDepositPayment(request);
    }

    @GetMapping("/reservation/{reservationId}")
    public DepositPaymentResponse getActive(@PathVariable Long reservationId) {
        return depositPaymentService.getActiveByReservation(reservationId);
    }

    // Dung rieng cho FE poll trang thai thanh toan - tra ve du moi status
    // (PENDING/PROCESSING/PAID/CANCELLED/EXPIRED), khac /reservation/{id} o tren
    // chi tra PENDING/PROCESSING nen se 404 ngay khi vua PAID.
    @GetMapping("/reservation/{reservationId}/latest")
    public DepositPaymentResponse getLatest(@PathVariable Long reservationId) {
        return depositPaymentService.getLatestByReservation(reservationId);
    }

    @PostMapping("/reservation/{reservationId}/cancel")
    public DepositPaymentResponse cancel(@PathVariable Long reservationId,
                                          @Valid @RequestBody CancelDepositPaymentRequest request) {
        return depositPaymentService.cancelDepositPayment(reservationId, request);
    }
}