package com.dabana.backend.modules.payment.controller;

import com.dabana.backend.modules.payment.dto.request.RefundBankInfoRequest;
import com.dabana.backend.modules.payment.dto.response.RefundBankInfoResponse;
import com.dabana.backend.modules.payment.service.RefundBankInfoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment/refund-bank-infos")
public class RefundBankInfoController {

    private final RefundBankInfoService refundBankInfoService;

    public RefundBankInfoController(RefundBankInfoService refundBankInfoService) {
        this.refundBankInfoService = refundBankInfoService;
    }

    @PutMapping
    public RefundBankInfoResponse createOrUpdate(@Valid @RequestBody RefundBankInfoRequest request) {
        return refundBankInfoService.createOrUpdate(request);
    }

    @GetMapping("/reservation/{reservationId}")
    public RefundBankInfoResponse getByReservation(@PathVariable Long reservationId) {
        return refundBankInfoService.getByReservation(reservationId);
    }
}