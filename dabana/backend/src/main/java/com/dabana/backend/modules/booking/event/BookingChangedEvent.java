package com.dabana.backend.modules.booking.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BookingChangedEvent {
    private final Long branchId;
    private final Long userId; // Dành cho khách hàng cá nhân (nếu cần bắn riêng cho user)
    private final Long bookingId;
}