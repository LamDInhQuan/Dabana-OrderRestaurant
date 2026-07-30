package com.dabana.backend.modules.booking.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class BookingTableChangedEvent {
    private final Long branchId;
    private final List<Long> tableId; // Dành cho khách hàng cá nhân (nếu cần bắn riêng cho user)
    private final Long bookingId;
}