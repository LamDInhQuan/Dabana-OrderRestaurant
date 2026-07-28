package com.dabana.backend.modules.payment.controller;

import com.dabana.backend.modules.payment.dto.request.CreateInvoicePaymentRequest;
import com.dabana.backend.modules.payment.dto.response.InvoicePaymentResponse;
import com.dabana.backend.modules.payment.service.InvoicePaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment/invoice-payments")
public class InvoicePaymentController {

    private final InvoicePaymentService invoicePaymentService;

    public InvoicePaymentController(InvoicePaymentService invoicePaymentService) {
        this.invoicePaymentService = invoicePaymentService;
    }

    @PostMapping
    public InvoicePaymentResponse create(@Valid @RequestBody CreateInvoicePaymentRequest request) {
        return invoicePaymentService.createInvoicePayment(request);
    }

    // FE poll trang thai o day (hoi thang payOS) sau khi hien QR, ~2-3s/lan.
    @GetMapping("/reservation/{reservationId}/status/{orderCode}")
    public InvoicePaymentResponse getStatus(@PathVariable Long reservationId, @PathVariable Long orderCode) {
        return invoicePaymentService.getStatus(reservationId, orderCode);
    }
}