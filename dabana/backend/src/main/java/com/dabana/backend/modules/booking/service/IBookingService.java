package com.dabana.backend.modules.booking.service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.dto.BookingDtos.*;

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

    // B12
    BookingResponse checkOut(Long bookingId);

    // EF04
    void expireOverdueHoldings();
}