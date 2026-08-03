package com.dabana.backend.modules.invoice.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.repository.BookingItemRepository;
import com.dabana.backend.modules.extraorder.entity.ExtraOrder;
import com.dabana.backend.modules.extraorder.repository.ExtraOrderRepository;
import com.dabana.backend.modules.invoice.dto.request.ConfirmCheckoutRequest;
import com.dabana.backend.modules.invoice.dto.response.InvoicePreviewResponse;
import com.dabana.backend.modules.invoice.dto.response.InvoiceResponse;
import com.dabana.backend.modules.invoice.entity.Invoice;
import com.dabana.backend.modules.invoice.mapper.InvoiceMapper;
import com.dabana.backend.modules.invoice.repository.InvoiceRepository;
import com.dabana.backend.modules.invoice.util.InvoiceErrorCode;
import com.dabana.backend.modules.invoice.util.InvoiceStatus;
import com.dabana.backend.modules.payment.repository.DepositPaymentRepository;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Tinh toan + ghi nhan hoa don thanh toan cuoi buoi (rs_invoices), tach
 * rieng khoi BookingService de khong lam phinh to vong doi Booking - chi
 * BookingService.checkOut() goi module nay TRUOC KHI doi status booking.
 *
 * Cong thuc: grand_total = preorder_subtotal + extra_order_subtotal + surcharge
 *            so tien thuc thu tai quay = grand_total - deposit_paid
 */
@Service
@RequiredArgsConstructor
public class InvoiceService implements IInvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BookingItemRepository bookingItemRepository;
    private final ExtraOrderRepository extraOrderRepository;
    private final DepositPaymentRepository depositPaymentRepository;
    private final InvoiceMapper invoiceMapper;

    @Override
    public InvoicePreviewResponse preview(Booking booking) {
        List<BookingItem> preorderItems = bookingItemRepository.findByBooking_IdOrderByCreatedAtAsc(booking.getId());
        List<ExtraOrder> extraOrders = extraOrderRepository.findByBookingIdOrderByCreatedAtAsc(booking.getId());

        List<InvoicePreviewResponse.LineItem> preorderLines = preorderItems.stream()
                .map(item -> InvoicePreviewResponse.LineItem.builder()
                        .name(item.getSnapshotName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getSnapshotPrice())
                        .lineTotal((item.getSnapshotPrice() != null ? item.getSnapshotPrice() : BigDecimal.ZERO)
                                .multiply(BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 1)))
                        .type("PREORDER")
                        .build())
                .toList();

        List<InvoicePreviewResponse.LineItem> extraLines = extraOrders.stream()
                .map(item -> InvoicePreviewResponse.LineItem.builder()
                        .name(item.getItemNameAtTime())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getPriceAtTime())
                        .lineTotal((item.getPriceAtTime() != null ? item.getPriceAtTime() : BigDecimal.ZERO)
                                .multiply(BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 1)))
                        .type("EXTRA")
                        .build())
                .toList();

        Optional<Invoice> invoiceOpt = invoiceRepository.findByBooking_Id(booking.getId());
        if (invoiceOpt.isPresent()) {
            Invoice invoice = invoiceOpt.get();
            BigDecimal subtotal = invoice.getPreorderSubtotal().add(invoice.getExtraOrderSubtotal());
            return InvoicePreviewResponse.builder()
                    .bookingId(booking.getId())
                    .preorderItems(preorderLines)
                    .extraOrderItems(extraLines)
                    .preorderSubtotal(invoice.getPreorderSubtotal())
                    .extraOrderSubtotal(invoice.getExtraOrderSubtotal())
                    .depositPaid(invoice.getDepositPaid())
                    .subtotalBeforeSurcharge(subtotal)
                    .amountDueBeforeSurcharge(subtotal.subtract(invoice.getDepositPaid()))
                    .invoiceId(invoice.getId())
                    .surcharge(invoice.getSurcharge())
                    .grandTotal(invoice.getGrandTotal())
                    .amountCollected(invoice.getGrandTotal().subtract(invoice.getDepositPaid()))
                    .paymentMethod(invoice.getPaymentMethod() != null ? invoice.getPaymentMethod().name() : null)
                    .status(invoice.getStatus() != null ? invoice.getStatus().name() : null)
                    .paidAt(invoice.getPaidAt())
                    .collectedByName(invoice.getCollectedBy() != null ? invoice.getCollectedBy().getFullName() : null)
                    .isPaid(true)
                    .build();
        }

        BigDecimal preorderSubtotal = sumLines(preorderLines);
        BigDecimal extraOrderSubtotal = sumLines(extraLines);
        BigDecimal depositPaid = resolveDepositPaid(booking.getId());
        if (depositPaid.compareTo(BigDecimal.ZERO) == 0 && booking.getEstimatedTotal() != null) {
            depositPaid = booking.getEstimatedTotal();
        }
        BigDecimal subtotalBeforeSurcharge = preorderSubtotal.add(extraOrderSubtotal);

        return InvoicePreviewResponse.builder()
                .bookingId(booking.getId())
                .preorderItems(preorderLines)
                .extraOrderItems(extraLines)
                .preorderSubtotal(preorderSubtotal)
                .extraOrderSubtotal(extraOrderSubtotal)
                .depositPaid(depositPaid)
                .subtotalBeforeSurcharge(subtotalBeforeSurcharge)
                .amountDueBeforeSurcharge(subtotalBeforeSurcharge.subtract(depositPaid))
                .isPaid(false)
                .build();
    }

    @Override
    @Transactional
    public Invoice createInvoiceForCheckout(Booking booking, ConfirmCheckoutRequest request, User collector) {
        if (invoiceRepository.existsByBooking_Id(booking.getId())) {
            throw new BusinessException(InvoiceErrorCode.INVOICE_ALREADY_PAID);
        }

        InvoicePreviewResponse preview = preview(booking);
        BigDecimal surcharge = request.getSurcharge() != null ? request.getSurcharge() : BigDecimal.ZERO;
        BigDecimal grandTotal = preview.getSubtotalBeforeSurcharge().add(surcharge);

        Invoice invoice = new Invoice();
        invoice.setBooking(booking);
        invoice.setPreorderSubtotal(preview.getPreorderSubtotal());
        invoice.setExtraOrderSubtotal(preview.getExtraOrderSubtotal());
        invoice.setSurcharge(surcharge);
        invoice.setGrandTotal(grandTotal);
        invoice.setDepositPaid(preview.getDepositPaid());
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoice.setCollectedBy(collector);

        return invoiceRepository.save(invoice);
    }

    @Override
    public InvoiceResponse toResponse(Invoice invoice) {
        return invoiceMapper.toResponse(invoice);
    }

    private BigDecimal sumLines(List<InvoicePreviewResponse.LineItem> lines) {
        return lines.stream()
                .map(InvoicePreviewResponse.LineItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Tien coc da thu THANH CONG (PAID) qua payOS cho reservation nay, neu co - mac dinh 0. */
    private BigDecimal resolveDepositPaid(Long bookingId) {
        return depositPaymentRepository.findByReservation_IdAndStatus(bookingId, DepositPaymentStatus.PAID)
                .map(dp -> dp.getAmountPaid() != null ? dp.getAmountPaid() : BigDecimal.ZERO)
                .orElse(BigDecimal.ZERO);
    }
}
