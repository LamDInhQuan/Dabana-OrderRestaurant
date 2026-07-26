package com.dabana.backend.modules.subscription.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.subscription.dto.response.AdminSubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.service.ISubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Chi ADMIN. Endpoint mark-paid la cong cu TAM THOI thay the payOS trong giai
 * doan chua tich hop thanh toan that (xem REFERENCE.md) - khi wiring payOS
 * xong, endpoint nay van huu ich de Admin doi soat thu cong (vi du nha hang
 * chuyen khoan tay, Admin xac nhan) nen khong can xoa di sau nay.
 */
@RestController
@RequestMapping("/api/admin/subscriptions")
@RequiredArgsConstructor
public class SubscriptionAdminController {

    private final ISubscriptionService subscriptionService;

    /**
     * Xem hoa don toan he thong, kem ten nha hang - dung cho man "Cho xac nhan
     * thanh toan". Vi du: GET /api/admin/subscriptions/invoices?status=PENDING,OVERDUE
     * Khong truyen status = lay toan bo hoa don (moi trang thai).
     */
    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<AdminSubscriptionInvoiceResponse>>> listInvoices(
            @RequestParam(required = false) List<InvoiceStatus> status
    ) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.listInvoicesForAdmin(status)));
    }

    @PostMapping("/invoices/{invoiceId}/mark-paid")
    public ResponseEntity<ApiResponse<Void>> markInvoicePaidManually(@PathVariable Long invoiceId) {
        subscriptionService.markInvoicePaidManually(invoiceId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, null));
    }
}