package com.dabana.backend.modules.booking;

import com.dabana.backend.modules.booking.dto.response.CustomerResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.dabana.backend.modules.branch2.entity.Branch;

import java.time.LocalDate;
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
    SELECT DISTINCT dt.id, b.status
    FROM Booking b
    JOIN b.bookingTables bt
    JOIN bt.diningTable dt
    WHERE dt.id IN :tableIds
      AND b.reservationTime = :reservationTime
      AND b.status IN :statuses
""")
    List<Object[]> findConflictTableStatusesInBooking(
            @Param("tableIds") List<Long> tableIds,
            @Param("reservationTime") LocalDateTime reservationTime,
            @Param("statuses") List<BookingStatus> statuses
    );

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @Query("SELECT b FROM Booking b WHERE b.status = 'HOLDING' AND b.holdExpiresAt < :now")
    List<Booking> findExpiredHoldings(@Param("now") LocalDateTime now);

    /* TẠM THỜI TẮT CÁC HÀM CHƯA DÙNG ĐỂ TRÁNH NGỢP VÀ RÁC CODE GIAI ĐOẠN ĐẦU */

    

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

//    @Query("""
//        SELECT b.branch.id, COALESCE(SUM(b.snapshotDepositAmount), 0), COUNT(b)
//        FROM Booking b
//        WHERE b.status = 'COMPLETED'
//        GROUP BY b.branch.id
//        """)
//    List<Object[]> sumDepositRevenueByBranch();

    @Query("""
        SELECT FUNCTION('DATE', b.createdAt), COUNT(b)
        FROM Booking b
        WHERE b.createdAt >= :from
        GROUP BY FUNCTION('DATE', b.createdAt)
        ORDER BY FUNCTION('DATE', b.createdAt)
        """)
    List<Object[]> countBookingsPerDaySince(@Param("from") LocalDateTime from);


    //         @Query("""
    //     select count(b) from Booking b where 
    //     date(b.createdAt) = :date and b.branch.id = :branchId
    //     """ )
    // Long countByBranchIdAndDate(@Param("branchId") Long branchId, @Param("date") LocalDate date);
    
    // @Query("""
    //     select count(b) from Booking b 
    //     where 
    //     date(b.createdAt) = :date and b.status = :checkedIn and b.branch.id = :branchId
    // """)
    // Long countByBranchIdAndStatusAndCreatedAt(@Param("branchId") Long branchId,
    //         @Param("checkedIn") BookingStatus checkedIn,
    //         @Param("date") LocalDate date);

    // @EntityGraph(attributePaths = { "bookingTables", "bookingTables.diningTable" })
    // List<Booking> findByBranchIdAndStatusAndReservationTimeAfterOrderByReservationTimeAsc(Long branchId,
    //         BookingStatus confirmed, LocalDateTime now, PageRequest of);

    //  @Query("""
    //     select count(b) from Booking b 
    //     where 
    //     date(b.createdAt) = :date and b.status in(:statuses) and b.branch.id = :branchId
    // """)
    // Long countByBranchIdAndStatusInAndCreatedAt(Long branchId, List<BookingStatus> statuses,
    //         LocalDate date);

    // @Query("""
    //     select b from Booking b
    //     where b.branch.id = :branchId
    //     and date(b.createdAt) = :date
    // """)
    // List<Booking> findByBranchIdAndCreatedAtDate(@Param("branchId") Long branchId,
    //         @Param("date") LocalDate date);

    List<Booking> findByBranchId(Long branchId);
    @Query("""
        select b from Booking b
        where b.branch.id = :branchId
        and date(b.createdAt) >= :from
    """)
    List<Booking> findByBranchIdAndCreatedAtAfter(@Param("branchId") Long branchId, @Param("from") LocalDate from);
    
    List<Booking> findByBranchIdAndCreatedAtBetween( Branch branch, LocalDate from,LocalDate to);

    List<Booking> findByContactEmailOrderByCreatedAtDesc(String email);

    long countByBookingTables_Id(Long id);

    @Query("""
        SELECT new com.dabana.backend.modules.booking.dto.response.CustomerResponse(
            b.customer.id,
            COALESCE(b.customer.fullName, b.contactName),
            COALESCE(b.customer.phone, b.contactPhone),
            COALESCE(b.customer.email, b.contactEmail),
            CAST(COUNT(b.id) AS java.lang.Long),
            CAST(SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) AS java.lang.Long),
            CAST(SUM(CASE WHEN b.status IN ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_RESTAURANT', 'NO_SHOW') THEN 1 ELSE 0 END) AS java.lang.Long),
            CAST(SUM(CASE WHEN b.status = 'COMPLETED' THEN COALESCE(b.estimatedTotal, 0) ELSE 0 END) AS java.math.BigDecimal),
            MAX(b.createdAt)
        )
        FROM Booking b
        WHERE b.branch.id = :branchId
          AND (:keyword IS NULL OR 
               b.customer.fullName LIKE %:keyword% OR b.customer.phone LIKE %:keyword% OR 
               b.contactName LIKE %:keyword% OR b.contactPhone LIKE %:keyword% OR b.contactEmail LIKE %:keyword%)
        GROUP BY 
            COALESCE(b.customer.id, b.contactPhone, b.contactEmail, b.id)
        ORDER BY MAX(b.createdAt) DESC
    """)
    List<CustomerResponse> getBranchCustomersStats(@Param("branchId") Long branchId,
                                                   @Param("keyword") String keyword);


}