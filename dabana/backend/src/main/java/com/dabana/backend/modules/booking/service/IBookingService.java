package com.dabana.backend.modules.booking.service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.dto.BookingDtos.*;
import com.dabana.backend.modules.booking.dto.response.CustomerResponse;
import com.dabana.backend.modules.invoice.dto.request.ConfirmCheckoutRequest;
import com.dabana.backend.modules.invoice.dto.response.InvoicePreviewResponse;

import java.util.List;

public interface IBookingService {
    // B01
    BookingResponse createHold(User user, CreateHoldRequest request);

    // B02
    BookingResponse getBookingDetail(Long bookingId, User user);

    List<BookingResponse> getMyBookings(User user);

    List<BookingResponse> getBookingsByEmail(String email);

    // B11
    BookingResponse cancel(Long bookingId, CancelRequest request);

    BookingResponse markNoShow(Long bookingId);

    // B08
    BookingResponse checkIn(Long bookingId);

    // B12 - nhan vien phai xac nhan phuong thuc thanh toan (request) va la nguoi thu ngan (collector)
    BookingResponse checkOut(Long bookingId, ConfirmCheckoutRequest request, User collector);

    // Xem truoc breakdown hoa don truoc khi xac nhan thanh toan
    InvoicePreviewResponse previewInvoice(Long bookingId);

    // EF04
    void expireOverdueHoldings();

    // B11 buoc 5-7 (tu dong): CONFIRMED qua gio hen + khoang dem -> NO_SHOW
    void expireOverdueConfirmedBookings();

    List<CustomerResponse> getListCustomerByBranch(Long branchId , String keyword) ;
}