package com.dabana.backend.modules.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerIdOrderByReservationTimeDesc(Long customerId);

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

    boolean existsByTable_IdAndReservationTimeAndStatusIn(
            Long tableId, LocalDateTime reservationTime, List<BookingStatus> statuses);

    // ======================================================
    // F47/F48/F49: Thong ke & bao cao (Quan tri vien)
    // ======================================================

    long countByStatus(BookingStatus status);

    List<Booking> findByCreatedAtAfter(LocalDateTime from);

    /** F47: doanh thu (tam tinh tu tien coc) theo chi nhanh, don da hoan tat. */
    @Query("""
        SELECT b.branch.id, COALESCE(SUM(b.snapshotDepositAmount), 0), COUNT(b)
        FROM Booking b
        WHERE b.status = 'COMPLETED'
        GROUP BY b.branch.id
        """)
    List<Object[]> sumDepositRevenueByBranch();

    /** F48: thong ke luot dat ban theo ngay trong khoang thoi gian. */
    @Query("""
        SELECT FUNCTION('DATE', b.createdAt), COUNT(b)
        FROM Booking b
        WHERE b.createdAt >= :from
        GROUP BY FUNCTION('DATE', b.createdAt)
        ORDER BY FUNCTION('DATE', b.createdAt)
        """)
    List<Object[]> countBookingsPerDaySince(@Param("from") LocalDateTime from);
}
