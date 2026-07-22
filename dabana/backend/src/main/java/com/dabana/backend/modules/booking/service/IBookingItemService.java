package com.dabana.backend.modules.booking.service;

import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.booking.dto.request.UpdateBookingItemQuantityRequest;
import com.dabana.backend.modules.booking.dto.response.PreorderItemResponse;

import java.util.List;

public interface IBookingItemService {
    void saveItems(
            Booking booking,
            List<BookingDtos.PreOrderItemRequest> requests
    );

    /** Liet ke mon dat truoc cua 1 booking - dung cho man hinh chi tiet ban ben Tab Goi mon. */
    List<PreorderItemResponse> getByBooking(Long bookingId);

    /** Sua so luong 1 dong mon dat truoc da luu. */
    PreorderItemResponse updateQuantity(Long itemId, UpdateBookingItemQuantityRequest request);

    /** Xoa han 1 dong mon dat truoc. */
    void deleteItem(Long itemId);
}