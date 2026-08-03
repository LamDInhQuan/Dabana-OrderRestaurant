package com.dabana.backend.modules.subscription.repository;

import com.dabana.backend.modules.subscription.entity.SubscriptionInvoice;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.enums.InvoiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionInvoiceRepository extends JpaRepository<SubscriptionInvoice, Long> {

    List<SubscriptionInvoice> findBySubscription_IdOrderByCreatedAtDesc(Long subscriptionId);

    /** Liet ke hoa don theo restaurant (khong phu thuoc subscription dang o trang thai nao). */
    List<SubscriptionInvoice> findBySubscription_Restaurant_IdOrderByCreatedAtDesc(Long restaurantId);

    /** Phuc vu man Admin: loc theo 1 hoac nhieu trang thai (vd PENDING, OVERDUE), moi nhat truoc. */
    List<SubscriptionInvoice> findByStatusInOrderByCreatedAtDesc(List<InvoiceStatus> statuses);

    /** Phuc vu man Admin: xem toan bo hoa don khi khong loc trang thai. */
    List<SubscriptionInvoice> findAllByOrderByCreatedAtDesc();

    Optional<SubscriptionInvoice> findFirstBySubscription_IdOrderByCreatedAtDesc(Long subscriptionId);

    /** Kiem tra da ton tai hoa don gia han cho chu ky periodStart chua de tranh sinh trung lap. */
    boolean existsBySubscription_IdAndInvoiceTypeAndPeriodStart(Long subscriptionId, InvoiceType invoiceType, LocalDate periodStart);

    /** Tim hoa don theo orderCode gui len payOS (dung cho webhook/poll). */
    Optional<SubscriptionInvoice> findByOrderCode(Long orderCode);

    /** Phuc vu scheduler: hoa don qua han thanh toan (due_date < hom nay, con PENDING). */
    List<SubscriptionInvoice> findByStatusAndDueDateBefore(InvoiceStatus status, LocalDate date);

    // ==================== BE-01: Admin - Bao cao doanh thu phi nen tang ====================

    /** Tong doanh thu PAID trong ky, dung cho KPI totalRevenue. */
    @Query("SELECT COALESCE(SUM(si.amount), 0) FROM SubscriptionInvoice si " +
            "WHERE si.status = :status AND si.paidAt BETWEEN :from AND :to")
    BigDecimal sumAmountByStatusAndPaidAtBetween(@Param("status") InvoiceStatus status,
                                                  @Param("from") LocalDateTime from,
                                                  @Param("to") LocalDateTime to);

    /** Doanh thu PAID trong ky, GROUP BY invoice_type (INITIAL/RENEWAL/UPGRADE) -> revenueByTime.series. */
    @Query("SELECT si.invoiceType, COALESCE(SUM(si.amount), 0) FROM SubscriptionInvoice si " +
            "WHERE si.status = :status AND si.paidAt BETWEEN :from AND :to " +
            "GROUP BY si.invoiceType")
    List<Object[]> sumAmountGroupByInvoiceTypeAndPaidAtBetween(@Param("status") InvoiceStatus status,
                                                                @Param("from") LocalDateTime from,
                                                                @Param("to") LocalDateTime to);

    /** Doanh thu PAID trong ky, GROUP BY plan_snapshot_name (BASIC/STANDARD/PRO) -> revenueByPlan. */
    @Query("SELECT si.planSnapshotName, COALESCE(SUM(si.amount), 0) FROM SubscriptionInvoice si " +
            "WHERE si.status = :status AND si.paidAt BETWEEN :from AND :to " +
            "GROUP BY si.planSnapshotName")
    List<Object[]> sumAmountGroupByPlanSnapshotAndPaidAtBetween(@Param("status") InvoiceStatus status,
                                                                 @Param("from") LocalDateTime from,
                                                                 @Param("to") LocalDateTime to);

    /** So hoa don PENDING/OVERDUE trong ky (rui ro that thu) -> KPI pendingInvoiceCount. */
    long countByStatusInAndDueDateBetween(List<InvoiceStatus> statuses, LocalDate from, LocalDate to);

    /** Tong so hoa don RENEWAL DEN HAN trong ky (mau so ty le gia han thanh cong). */
    long countByInvoiceTypeAndDueDateBetween(InvoiceType invoiceType, LocalDate from, LocalDate to);

    /** So hoa don RENEWAL DEN HAN trong ky va da PAID (tu so ty le gia han thanh cong). */
    long countByInvoiceTypeAndStatusAndDueDateBetween(InvoiceType invoiceType, InvoiceStatus status,
                                                       LocalDate from, LocalDate to);
}