package com.dabana.backend.modules.booking.service;

import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.diningtable.entity.DiningTable;

import java.time.LocalDateTime;
import java.util.List;

public interface IBookingTableService {
    List<DiningTable> loadTables(List<Long> tableIds);

    void validateTablesGuestCount(
            List<DiningTable> tables,
            Integer guestCount
    );

    void validateBookingConflict(
            List<Long> tableIds,
            LocalDateTime reservationTime
    );

    void saveBookingTables(
            Booking booking,
            List<DiningTable> tables
    );
}
