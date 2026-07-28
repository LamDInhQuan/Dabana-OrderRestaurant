package com.dabana.backend.modules.booking.repository;

import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.BookingTable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface BookingTableRepository extends JpaRepository<BookingTable, Long> {

    /**
     * Dung boi OrderBoardService (Tab Goi Mon) de tim, voi 1 tap tableId cho
     * truoc, cac dong rs_reservation_tables ma booking gan voi no dang o
     * trang thai "active" (CONFIRMED / CHECKED_IN) - tuc ung voi ban dang
     * RESERVED / OCCUPIED theo Bang chuyen doi trang thai ban.
     * EntityGraph fetch san booking + customer de tranh N+1 khi build
     * ActiveBookingResponse cho tung ban tren board.
     */
    @EntityGraph(attributePaths = {"booking", "booking.customer", "diningTable"})
    List<BookingTable> findByDiningTable_IdInAndBooking_StatusIn(
            Collection<Long> tableIds, Collection<BookingStatus> statuses);
    
}
