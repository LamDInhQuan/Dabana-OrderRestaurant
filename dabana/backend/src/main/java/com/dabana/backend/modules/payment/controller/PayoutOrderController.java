package com.dabana.backend.modules.payment.controller;

import com.dabana.backend.modules.payment.dto.request.CreatePayoutOrderRequest;
import com.dabana.backend.modules.payment.dto.response.PayoutOrderResponse;
import com.dabana.backend.modules.payment.service.PayoutOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment/payouts")
public class PayoutOrderController {

    private final PayoutOrderService payoutOrderService;

    public PayoutOrderController(PayoutOrderService payoutOrderService) {
        this.payoutOrderService = payoutOrderService;
    }

    @PostMapping
    public PayoutOrderResponse create(@Valid @RequestBody CreatePayoutOrderRequest request) {
        // TODO: lay nhan vien dang dang nhap tu SecurityContext theo co che auth thuc te,
        // thay cho "null" o day.
        return payoutOrderService.createPayoutOrder(request, null);
    }

    @GetMapping("/reservation/{reservationId}")
    public PayoutOrderResponse getByReservation(@PathVariable Long reservationId) {
        return payoutOrderService.getByReservation(reservationId);
    }
}