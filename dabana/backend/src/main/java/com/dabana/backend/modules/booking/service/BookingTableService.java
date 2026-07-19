package com.dabana.backend.modules.booking.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.*;
import com.dabana.backend.modules.booking.repository.BookingTableRepository;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableErrorCode;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingTableService implements IBookingTableService {

    private static final List<BookingStatus> CONFLICT_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.CONFIRMED
    );

    private final DiningTableRepository diningTableRepository;
    private final BookingRepository bookingRepository;
    private final BookingTableRepository bookingTableRepository;

    @Override
    public List<DiningTable> loadTables(List<Long> tableIds) {
        List<DiningTable> tables = diningTableRepository.findAllById(tableIds);
        if (tables.size() != tableIds.size()) {
            throw new BusinessException(DiningTableErrorCode.TABLE_NOT_FOUND);
        }
        return tables;
    }

    @Override
    public void validateTablesGuestCount(
            List<DiningTable> tables,
            Integer guestCount
    ) {
        int totalCapacity = 0;
        for (DiningTable table : tables) {
            if (table.getStatus() == DiningTableStatus.MAINTENANCE) {
                throw new BusinessException(DiningTableErrorCode.TABLE_MAINTENANCE);
            }
            totalCapacity += table.getCapacity();
        }
        if (totalCapacity < guestCount) {
            throw new BusinessException(DiningTableErrorCode.TABLE_CAPACITY_INSUFFICIENT);
        }
    }

    @Override
    public void validateBookingConflict(
            List<Long> tableIds,
            LocalDateTime reservationTime
    ) {
        boolean conflict = bookingRepository.existsByTableIdInAndReservationTimeAndStatusIn(
                tableIds, reservationTime, CONFLICT_STATUSES);

        if (conflict) {
            throw new BusinessException(BookingErrorCode.TABLE_ALREADY_ASSIGNED);
        }
    }

    @Override
    public void saveBookingTables(
            Booking booking,
            List<DiningTable> tables
    ) {
        List<BookingTable> bookingTables = new ArrayList<>();
        for (DiningTable table : tables) {
            BookingTable bookingTable = new BookingTable();
            bookingTable.setBooking(booking);
            bookingTable.setDiningTable(table);
            bookingTables.add(bookingTable);
        }
        bookingTableRepository.saveAll(bookingTables);
    }
}