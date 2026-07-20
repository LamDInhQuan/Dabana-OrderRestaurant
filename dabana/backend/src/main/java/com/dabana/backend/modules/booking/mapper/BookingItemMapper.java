package com.dabana.backend.modules.booking.mapper;

import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import org.springframework.stereotype.Component;

@Component
public class BookingItemMapper {

    public BookingDtos.BookingItemResponse toResponse(BookingItem entity) {
        return BookingDtos.BookingItemResponse.builder()
                .name(entity.getSnapshotName())
                .price(entity.getSnapshotPrice())
                .quantity(entity.getQuantity())
                .build();
    }

}