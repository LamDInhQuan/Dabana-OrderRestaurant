package com.dabana.backend.modules.invoice.service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.invoice.dto.request.ConfirmCheckoutRequest;
import com.dabana.backend.modules.invoice.dto.response.InvoicePreviewResponse;
import com.dabana.backend.modules.invoice.dto.response.InvoiceResponse;
import com.dabana.backend.modules.invoice.entity.Invoice;

public interface IInvoiceService {

    /** Tinh truoc breakdown hoa don, KHONG ghi DB - dung cho man hinh xac nhan thanh toan. */
    InvoicePreviewResponse preview(Booking booking);

    /**
     * Tao va luu hoa don (rs_invoices) cho 1 booking dang CHECKED_IN, dung
     * ngay truoc khi BookingService chuyen status sang COMPLETED. Nem loi
     * INVOICE_ALREADY_PAID neu booking nay da co hoa don roi (checkout goi 2 lan).
     */
    Invoice createInvoiceForCheckout(Booking booking, ConfirmCheckoutRequest request, User collector);

    InvoiceResponse toResponse(Invoice invoice);
}
