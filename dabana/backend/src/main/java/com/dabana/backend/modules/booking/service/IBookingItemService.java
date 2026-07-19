package com.dabana.backend.modules.booking.service;

import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.dto.BookingDtos;

import java.util.List;

public interface IBookingItemService {
    void saveItems(
            Booking booking,
            List<BookingDtos.PreOrderItemRequest> requests
    );
}
