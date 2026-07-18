package com.dabana.backend.modules.booking.repository;

import com.dabana.backend.modules.booking.entity.Booking;
import com.dabana.backend.modules.booking.util.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByReservationTimeDesc(Long userId);

    List<Booking> findByBranchIdAndStatus(Long branchId, BookingStatus status);

    /** B01 EF04: tim cac don dang giu ban da het han de tu dong huy (scheduled job). */
    @Query("SELECT b FROM Booking b WHERE b.status = 'HOLDING' AND b.holdExpiresAt < :now")
    List<Booking> findExpiredHoldings(@Param("now") LocalDateTime now);

    /** B09 buoc 5 / B11 buoc 5: tim don da qua gio hen nhung chua check-in de canh bao no-show. */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'CONFIRMED'
        AND b.reservationTime < :threshold
        """)
    List<Booking> findOverdueUncheckedIn(@Param("threshold") LocalDateTime threshold);

    /** B09 buoc 4-5: tim don sap den gio hen de gui nhac lich (chua gui nhac). */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'CONFIRMED'
        AND b.reminderSent = false
        AND b.reservationTime BETWEEN :now AND :reminderWindow
        """)
    List<Booking> findBookingsNeedingReminder(
            @Param("now") LocalDateTime now,
            @Param("reminderWindow") LocalDateTime reminderWindow);

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        JOIN b.bookingTables bt
        JOIN bt.diningTable dt
        WHERE dt.id = :tableId
        AND b.reservationTime = :reservationTime
        AND b.status IN :statuses
        """)
    boolean existsByTableIdAndReservationTimeAndStatusIn(
            @Param("tableId") Long tableId,
            @Param("reservationTime") LocalDateTime reservationTime,
            @Param("statuses") List<BookingStatus> statuses);

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        JOIN b.bookingTables bt
        JOIN bt.diningTable dt
        WHERE dt.id IN :tableIds
        AND b.reservationTime = :reservationTime
        AND b.status IN :statuses
        """)
    boolean existsByTableIdInAndReservationTimeAndStatusIn(
            @Param("tableIds") List<Long> tableIds,
            @Param("reservationTime") LocalDateTime reservationTime,
            @Param("statuses") List<BookingStatus> statuses);

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        JOIN b.bookingTables bt
        JOIN bt.diningTable dt
        WHERE dt.id = :tableId
        AND b.reservationTime > :now
        AND b.status IN :statuses
        """)
    boolean existsFutureBookingsByTableId(@Param("tableId") Long tableId,
                                          @Param("now") LocalDateTime now,
                                          @Param("statuses") List<BookingStatus> statuses);

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Booking b
        JOIN b.bookingTables bt
        JOIN bt.diningTable dt
        JOIN dt.zone z
        WHERE z.id = :zoneId
        AND b.reservationTime > :now
        AND b.status IN :statuses
        """)
    boolean existsFutureBookingsByZoneId(@Param("zoneId") Long zoneId,
                                         @Param("now") LocalDateTime now,
                                         @Param("statuses") List<BookingStatus> statuses);
}
