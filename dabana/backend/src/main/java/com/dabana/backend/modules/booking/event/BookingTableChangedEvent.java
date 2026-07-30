package com.dabana.backend.modules.booking.event;

import com.dabana.backend.modules.booking.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;


@Getter
@AllArgsConstructor
public class BookingTableChangedEvent {
    private final BookingStatus status ;
    private final List<Long> tableIds; // Dành cho khách hàng cá nhân (nếu cần bắn riêng cho user)
    private final Long bookingId;
    private final Long branchId ;
    private final Long userId;
    private final LocalDateTime reservationTime ;
    private final List<Long> zoneIds ;
    private final String email ;
}