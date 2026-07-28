package com.dabana.backend.modules.payment.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingErrorCode;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.invoice.dto.response.InvoicePreviewResponse;
import com.dabana.backend.modules.invoice.service.IInvoiceService;
import com.dabana.backend.modules.payment.dto.request.CreateInvoicePaymentRequest;
import com.dabana.backend.modules.payment.dto.response.InvoicePaymentResponse;
import com.dabana.backend.modules.payment.entity.BranchBankAccount;
import com.dabana.backend.modules.payment.repository.BranchBankAccountRepository;
import com.dabana.backend.modules.payment.util.PaymentErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.exception.PayOSException;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;

import java.math.BigDecimal;

/**
 * Tao/tra cuu QR thanh toan HOA DON CUOI BUOI qua payOS - dung lai
 * PayosClientProvider (client rieng cho tung branch) GIONG DepositPaymentService,
 * nhung KHONG PERSIST gi vao DB (khong co bang rieng, khong dung
 * pm_deposit_payments de tranh lam sai lech InvoiceService.resolveDepositPaid()
 * dang doc bang do de tinh "coc da thu").
 *
 * Trang thai duoc hoi TRUC TIEP tu payOS moi lan poll (client.paymentRequests().get()),
 * khong qua webhook/DB trung gian - orderCode chi song trong session cua modal
 * thanh toan o FE. Sau khi FE thay status=PAID, nhan vien bam "Xac nhan" de goi
 * BookingService.checkOut() nhu binh thuong, hoan tat tao rs_invoices.
 */
@Slf4j
@Service
public class InvoicePaymentService {

    private final BranchBankAccountRepository branchBankAccountRepository;
    private final BookingRepository bookingRepository;
    private final PayosClientProvider payosClientProvider;
    private final IInvoiceService invoiceService;

    @Value("${app.payment.cancel-url-template}")
    private String cancelUrlTemplate;

    @Value("${app.payment.return-url-template}")
    private String returnUrlTemplate;

    public InvoicePaymentService(BranchBankAccountRepository branchBankAccountRepository,
            BookingRepository bookingRepository,
            PayosClientProvider payosClientProvider,
            IInvoiceService invoiceService) {
        this.branchBankAccountRepository = branchBankAccountRepository;
        this.bookingRepository = bookingRepository;
        this.payosClientProvider = payosClientProvider;
        this.invoiceService = invoiceService;
    }

    public InvoicePaymentResponse createInvoicePayment(CreateInvoicePaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getReservationId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.RESERVATION_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException(BookingErrorCode.BOOKING_CANNOT_CHECK_OUT);
        }

        InvoicePreviewResponse preview = invoiceService.preview(booking);
        BigDecimal surcharge = request.getSurcharge() != null ? request.getSurcharge() : BigDecimal.ZERO;
        BigDecimal amount = preview.getAmountDueBeforeSurcharge().add(surcharge);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(PaymentErrorCode.INVOICE_PAYMENT_AMOUNT_INVALID);
        }

        BranchBankAccount branchBankAccount = branchBankAccountRepository
                .findByBranch_Id(booking.getBranch().getId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_NOT_FOUND));

        PayOS client = payosClientProvider.getPaymentClientForBranch(booking.getBranch().getId());

        long orderCode = System.currentTimeMillis();
        String description = "Thanh toan HDBK " + booking.getId();
        String cancelUrl = cancelUrlTemplate.replace("{reservationId}", String.valueOf(booking.getId()));
        String returnUrl = returnUrlTemplate.replace("{reservationId}", String.valueOf(booking.getId()));

        CreatePaymentLinkRequest payload = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(2000L)
                .description(description)
                .buyerName(booking.getContactName())
                .buyerPhone(booking.getContactPhone())
                .cancelUrl(cancelUrl)
                .returnUrl(returnUrl)
                .build();

        CreatePaymentLinkResponse payosResponse;
        try {
            payosResponse = client.paymentRequests().create(payload);
        } catch (PayOSException e) {
            log.error("Tao QR thanh toan hoa don that bai, reservationId={}", booking.getId(), e);
            throw new BusinessException(PaymentErrorCode.PAYOS_CREATE_PAYMENT_LINK_FAILED);
        }

        return InvoicePaymentResponse.builder()
                .reservationId(booking.getId())
                .orderCode(orderCode)
                .amount(amount)
                .surcharge(surcharge)
                .checkoutUrl(payosResponse.getCheckoutUrl())
                .qrCode(payosResponse.getQrCode())
                .bin(payosResponse.getBin())
                .accountNumber(payosResponse.getAccountNumber())
                .accountName(payosResponse.getAccountName())
                .status("PENDING")
                .amountPaid(BigDecimal.ZERO)
                .amountRemaining(amount)
                .build();
    }

    /** FE poll endpoint nay (hoi thang payOS, khong qua DB) de biet khach da quet QR xong chua. */
    public InvoicePaymentResponse getStatus(Long reservationId, Long orderCode) {
        Booking booking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.RESERVATION_NOT_FOUND));

        PayOS client = payosClientProvider.getPaymentClientForBranch(booking.getBranch().getId());

        PaymentLink info;
        try {
            info = client.paymentRequests().get(orderCode);
        } catch (PayOSException e) {
            log.error("Khong lay duoc trang thai QR tu payOS, orderCode={}", orderCode, e);
            throw new BusinessException(PaymentErrorCode.PAYOS_SYNC_PAYMENT_FAILED);
        }

        return InvoicePaymentResponse.builder()
                .reservationId(reservationId)
                .orderCode(orderCode)
                .amount(BigDecimal.valueOf(info.getAmount()))
                .status(String.valueOf(info.getStatus()))
                .amountPaid(info.getAmountPaid() != null ? BigDecimal.valueOf(info.getAmountPaid()) : BigDecimal.ZERO)
                .amountRemaining(info.getAmountRemaining() != null ? BigDecimal.valueOf(info.getAmountRemaining()) : null)
                .build();
    }
}