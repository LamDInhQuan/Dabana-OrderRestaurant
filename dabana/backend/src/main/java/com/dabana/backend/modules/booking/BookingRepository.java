package com.dabana.backend.modules.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Phục vụ màn hình Lịch sử đặt bàn của khách hàng
    List<Booking> findByCustomerIdOrderByReservationTimeDesc(Long customerId);

    // Phục vụ màn hình Quản lý đơn đặt bàn của Nhà hàng/Chi nhánh
    List<Booking> findByBranchIdAndStatus(Long branchId, BookingStatus status);

    /**
     * B01: Kiểm tra xem danh sách bàn được chọn có bị TRÙNG lịch vào khung giờ đó không.
     * Hàm này bắt buộc phải giữ lại để validate trước khi cho khách Giữ bàn (Hold).
     */
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
    SELECT DISTINCT dt.id
    FROM Booking b
    JOIN b.bookingTables bt
    JOIN bt.diningTable dt
    WHERE dt.id IN :tableIds
      AND b.reservationTime = :reservationTime
      AND b.status IN :statuses
""")
    List<Long> findConflictTableIdsInBooking(
            @Param("tableIds") List<Long> tableIds,
            @Param("reservationTime") LocalDateTime reservationTime,
            @Param("statuses") List<BookingStatus> statuses
    );

    /* TẠM THỜI TẮT CÁC HÀM CHƯA DÙNG ĐỂ TRÁNH NGỢP VÀ RÁC CODE GIAI ĐOẠN ĐẦU */

    /*
    @Query("SELECT b FROM Booking b WHERE b.status = 'HOLDING' AND b.holdExpiresAt < :now")
    List<Booking> findExpiredHoldings(@Param("now") LocalDateTime now);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'CONFIRMED'
        AND b.reservationTime < :threshold
        """)
    List<Booking> findOverdueUncheckedIn(@Param("threshold") LocalDateTime threshold);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.status = 'CONFIRMED'
        AND b.reminderSent = false
        AND b.reservationTime BETWEEN :now AND :reminderWindow
        """)
    List<Booking> findBookingsNeedingReminder(
            @Param("now") LocalDateTime now,
            @Param("reminderWindow") LocalDateTime reminderWindow);

    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
            "JOIN b.bookingTables bt " +
            "WHERE bt.diningTable.id = :tableId " +
            "AND b.reservationTime = :reservationTime " +
            "AND b.status IN :statuses")
    boolean checkTableBookingExists(
            @Param("tableId") Long tableId,
            @Param("reservationTime") LocalDateTime reservationTime,
            @Param("statuses") List<BookingStatus> statuses
    );

    long countByStatus(BookingStatus status);

    List<Booking> findByCreatedAtAfter(LocalDateTime from);

    @Query("""
        SELECT b.branch.id, COALESCE(SUM(b.snapshotDepositAmount), 0), COUNT(b)
        FROM Booking b
        WHERE b.status = 'COMPLETED'
        GROUP BY b.branch.id
        """)
    List<Object[]> sumDepositRevenueByBranch();

    @Query("""
        SELECT FUNCTION('DATE', b.createdAt), COUNT(b)
        FROM Booking b
        WHERE b.createdAt >= :from
        GROUP BY FUNCTION('DATE', b.createdAt)
        ORDER BY FUNCTION('DATE', b.createdAt)
        """)
    List<Object[]> countBookingsPerDaySince(@Param("from") LocalDateTime from);
    */
}