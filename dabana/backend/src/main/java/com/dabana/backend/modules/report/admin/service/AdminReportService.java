package com.dabana.backend.modules.report.admin.service;

import com.dabana.backend.modules.report.admin.dto.*;
import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import com.dabana.backend.modules.report.dto.PeriodQueryParams;
import com.dabana.backend.modules.report.dto.PieSlice;
import com.dabana.backend.modules.report.util.PeriodRange;
import com.dabana.backend.modules.report.util.PeriodRange.Range;
import com.dabana.backend.modules.report.util.ReportPeriod;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.enums.InvoiceType;
import com.dabana.backend.modules.subscription.enums.SubscriptionStatus;
import com.dabana.backend.modules.subscription.repository.RestaurantSubscriptionRepository;
import com.dabana.backend.modules.subscription.repository.SubscriptionInvoiceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * Toàn bộ số liệu report ADMIN.
 * Riêng khối SUBSCRIPTIONS (BE-01) dùng lại SubscriptionInvoiceRepository /
 * RestaurantSubscriptionRepository (đúng tinh thần kịch bản mục 4.2 — tái dùng
 * Repository sẵn có, an toàn kiểu dữ liệu hơn SQL thuần). Các khối còn lại
 * (restaurants/reservations/deposits/users) vẫn dùng native SQL qua EntityManager.
 */
@Service
@RequiredArgsConstructor
public class AdminReportService {

    @PersistenceContext
    private EntityManager em;

    private final SubscriptionInvoiceRepository subscriptionInvoiceRepository;
    private final RestaurantSubscriptionRepository restaurantSubscriptionRepository;

    // ============================================================ 1. SUBSCRIPTIONS
    // BE-01 — dùng lại SubscriptionInvoiceRepository / RestaurantSubscriptionRepository
    // (đã bổ sung method @Query riêng cho BE-01, không đụng method của task khác).
    public AdminSubscriptionReportResponse buildSubscriptionReport(PeriodQueryParams p) {
        Range r = PeriodRange.resolve(p);
        boolean compare = Boolean.TRUE.equals(p.getCompareWithPrevious());
        Range prevRange = compare ? PeriodRange.resolvePrevious(p) : null;
        LocalDate rFromDate = r.from().toLocalDate();
        LocalDate rToDate = r.to().toLocalDate();

        // ---- KPI 1: totalRevenue ----
        BigDecimal totalRevenue = subscriptionInvoiceRepository.sumAmountByStatusAndPaidAtBetween(
                InvoiceStatus.PAID, r.from(), r.to());
        BigDecimal prevRevenue = compare
                ? subscriptionInvoiceRepository.sumAmountByStatusAndPaidAtBetween(
                        InvoiceStatus.PAID, prevRange.from(), prevRange.to())
                : null;

        // ---- KPI 2: pendingInvoiceCount = PENDING/OVERDUE, đến hạn (due_date) trong kỳ ----
        List<InvoiceStatus> riskStatuses = List.of(InvoiceStatus.PENDING, InvoiceStatus.OVERDUE);
        long pendingInvoices = subscriptionInvoiceRepository.countByStatusInAndDueDateBetween(
                riskStatuses, rFromDate, rToDate);

        // ---- KPI 3: renewalSuccessRate = RENEWAL PAID / tổng RENEWAL đến hạn (due_date) trong kỳ ----
        long renewalTotal = subscriptionInvoiceRepository.countByInvoiceTypeAndDueDateBetween(
                InvoiceType.RENEWAL, rFromDate, rToDate);
        long renewalPaid = subscriptionInvoiceRepository.countByInvoiceTypeAndStatusAndDueDateBetween(
                InvoiceType.RENEWAL, InvoiceStatus.PAID, rFromDate, rToDate);
        BigDecimal renewalRate = pct(BigDecimal.valueOf(renewalPaid), BigDecimal.valueOf(renewalTotal));

        List<KpiCard> kpis = List.of(
                kpi("totalRevenue", "Doanh thu phí nền tảng", totalRevenue, prevRevenue),
                kpi("pendingInvoiceCount", "Hóa đơn PENDING/OVERDUE trong kỳ", BigDecimal.valueOf(pendingInvoices), null),
                kpi("renewalSuccessRate", "Tỷ lệ gia hạn thành công (%)", renewalRate, null)
        );

        // ---- revenueByTime: stacked theo invoice_type, PAID trong kỳ ----
        List<ChartPoint> revenueByTime = new ArrayList<>();
        revenueByTime.add(toRevenueChartPoint(compare ? "Kỳ này" : "Kỳ đã chọn", r));
        if (compare) {
            revenueByTime.add(toRevenueChartPoint("Kỳ trước", prevRange));
        }

        // ---- revenueByPlan: GROUP BY plan_snapshot_name, PAID trong kỳ ----
        List<PieSlice> revenueByPlan = new ArrayList<>();
        for (Object[] row : subscriptionInvoiceRepository.sumAmountGroupByPlanSnapshotAndPaidAtBetween(
                InvoiceStatus.PAID, r.from(), r.to())) {
            revenueByPlan.add(PieSlice.builder()
                    .label((String) row[0])
                    .value((BigDecimal) row[1])
                    .build());
        }

        // ---- subscriptionStatusBreakdown: snapshot "tại thời điểm cuối kỳ" (không lọc theo created_at BETWEEN) ----
        Map<String, BigDecimal> statusCounts = new LinkedHashMap<>();
        for (SubscriptionStatus s : SubscriptionStatus.values()) {
            statusCounts.put(s.name(), BigDecimal.ZERO);
        }
        for (Object[] row : restaurantSubscriptionRepository.countGroupByStatusCreatedAtBefore(r.to())) {
            SubscriptionStatus status = (SubscriptionStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), BigDecimal.valueOf(count));
        }
        List<PieSlice> statusBreakdown = new ArrayList<>();
        statusCounts.forEach((label, value) -> statusBreakdown.add(PieSlice.builder().label(label).value(value).build()));

        // Nhà hàng sắp hết hạn gói (7 ngày tới) — KHÔNG lọc theo period.
        List<AdminSubscriptionReportResponse.ExpiringSoonRow> upcomingExpiries = new ArrayList<>();
        try {
            @SuppressWarnings("unchecked")
            List<Object[]> expRows = em.createNativeQuery(
                    "SELECT s.restaurant_id, r.restaurant_name, s.plan_name_snapshot, DATE(s.current_period_end) " +
                    "FROM sub_subscriptions s JOIN rt_restaurants r ON r.id = s.restaurant_id " +
                    "WHERE s.status='ACTIVE' AND s.current_period_end BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) " +
                    "ORDER BY s.current_period_end ASC").getResultList();
            for (Object[] t : expRows) {
                upcomingExpiries.add(AdminSubscriptionReportResponse.ExpiringSoonRow.builder()
                        .restaurantId(asLong(t[0]))
                        .restaurantName(t[1] == null ? "" : t[1].toString())
                        .planName(t[2] == null ? "" : t[2].toString())
                        .expiryDate(t[3] == null ? null : t[3].toString())
                        .build());
            }
        } catch (RuntimeException ignore) {
            upcomingExpiries = new ArrayList<>();
        }

        return AdminSubscriptionReportResponse.builder()
                .kpis(kpis)
                .revenueByTime(revenueByTime)
                .revenueByPlan(revenueByPlan)
                .subscriptionStatusBreakdown(statusBreakdown)
                .upcomingExpiries(upcomingExpiries)
                .build();
    }

    /** 1 cột revenueByTime: series = INITIAL/RENEWAL/UPGRADE, PAID trong khoảng range đã cho. */
    private ChartPoint toRevenueChartPoint(String label, Range range) {
        Map<String, BigDecimal> series = new LinkedHashMap<>();
        for (InvoiceType type : InvoiceType.values()) {
            series.put(type.name(), BigDecimal.ZERO);
        }
        for (Object[] row : subscriptionInvoiceRepository.sumAmountGroupByInvoiceTypeAndPaidAtBetween(
                InvoiceStatus.PAID, range.from(), range.to())) {
            InvoiceType type = (InvoiceType) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            series.put(type.name(), amount);
        }
        return ChartPoint.builder().label(label).series(series).build();
    }

    // ============================================================ 2. RESTAURANTS
    public AdminRestaurantReportResponse buildRestaurantReport(PeriodQueryParams p) {
        Range r = PeriodRange.resolve(p);
        String f = fmt(p);

        long newRestaurants = scalarCount(
                "SELECT COUNT(*) FROM rt_restaurants WHERE created_at BETWEEN :from AND :to", r);
        BigDecimal prev = Boolean.TRUE.equals(p.getCompareWithPrevious())
                ? BigDecimal.valueOf(scalarCount(
                        "SELECT COUNT(*) FROM rt_restaurants WHERE created_at BETWEEN :from AND :to",
                        PeriodRange.resolvePrevious(p)))
                : null;
        long newBranches = scalarCount(
                "SELECT COUNT(*) FROM rt_branches WHERE created_at BETWEEN :from AND :to", r);
        long activeRestaurants = scalarCount(
                "SELECT COUNT(*) FROM rt_restaurants WHERE is_active = 1 AND created_at BETWEEN :from AND :to", r);

        List<KpiCard> kpis = List.of(
                kpi("newRestaurantCount", "Nhà hàng mới", BigDecimal.valueOf(newRestaurants), prev),
                kpi("newBranchCount", "Chi nhánh mới", BigDecimal.valueOf(newBranches), null),
                kpi("activeRestaurantCount", "Nhà hàng đang hoạt động", BigDecimal.valueOf(activeRestaurants), null)
        );

        List<ChartPoint> newByTime = singleSeries(
                "SELECT DATE_FORMAT(created_at,'" + f + "') b, COUNT(*) FROM rt_restaurants " +
                "WHERE created_at BETWEEN :from AND :to GROUP BY b ORDER BY b", r);

        List<PieSlice> approvalBreakdown = pieQuery(
                "SELECT approval_status, COUNT(*) FROM rt_restaurants WHERE created_at BETWEEN :from AND :to GROUP BY approval_status", r);

        return AdminRestaurantReportResponse.builder()
                .kpis(kpis)
                .newRestaurantsByTime(newByTime)
                .approvalStatusBreakdown(approvalBreakdown)
                .build();
    }

    // ============================================================ 3. RESERVATIONS
    public AdminReservationReportResponse buildReservationReport(PeriodQueryParams p) {
        Range r = PeriodRange.resolve(p);
        String f = fmt(p);

        long total = scalarCount(
                "SELECT COUNT(*) FROM rs_reservations WHERE created_at BETWEEN :from AND :to", r);
        BigDecimal prev = Boolean.TRUE.equals(p.getCompareWithPrevious())
                ? BigDecimal.valueOf(scalarCount(
                        "SELECT COUNT(*) FROM rs_reservations WHERE created_at BETWEEN :from AND :to",
                        PeriodRange.resolvePrevious(p)))
                : null;

        Object[] row = (Object[]) em.createNativeQuery(
                "SELECT COALESCE(SUM(status='COMPLETED'),0), " +
                "COALESCE(SUM(status IN ('CANCELLED_BY_CUSTOMER','CANCELLED_BY_RESTAURANT')),0), " +
                "COALESCE(SUM(status='NO_SHOW'),0) " +
                "FROM rs_reservations WHERE created_at BETWEEN :from AND :to")
                .setParameter("from", r.from()).setParameter("to", r.to())
                .getSingleResult();
        BigDecimal totalBd = BigDecimal.valueOf(total);

        List<KpiCard> kpis = List.of(
                kpi("totalReservations", "Tổng lượt đặt bàn", totalBd, prev),
                kpi("completedRate", "Tỷ lệ hoàn thành (%)", pct(num(row[0]), totalBd), null),
                kpi("cancelledRate", "Tỷ lệ hủy (%)", pct(num(row[1]), totalBd), null),
                kpi("noShowRate", "Tỷ lệ vắng mặt (%)", pct(num(row[2]), totalBd), null)
        );

        List<ChartPoint> byTime = singleSeries(
                "SELECT DATE_FORMAT(created_at,'" + f + "') b, COUNT(*) FROM rs_reservations " +
                "WHERE created_at BETWEEN :from AND :to GROUP BY b ORDER BY b", r);

        List<PieSlice> statusBreakdown = pieQuery(
                "SELECT status, COUNT(*) FROM rs_reservations WHERE created_at BETWEEN :from AND :to GROUP BY status", r);

        List<Object[]> topRows = queryList(
                "SELECT rs.branch_id, b.branch_name, COUNT(*) c FROM rs_reservations rs " +
                "JOIN rt_branches b ON b.id = rs.branch_id " +
                "WHERE rs.created_at BETWEEN :from AND :to " +
                "GROUP BY rs.branch_id, b.branch_name ORDER BY c DESC LIMIT 10", r);
        List<AdminReservationReportResponse.TopBranchRow> topBranches = new ArrayList<>();
        for (Object[] t : topRows) {
            topBranches.add(AdminReservationReportResponse.TopBranchRow.builder()
                    .branchId(asLong(t[0]))
                    .branchName(t[1] == null ? "" : t[1].toString())
                    .reservationCount(asLong(t[2]))
                    .build());
        }

        return AdminReservationReportResponse.builder()
                .kpis(kpis)
                .reservationsByTime(byTime)
                .statusBreakdown(statusBreakdown)
                .topBranches(topBranches)
                .build();
    }

    // ============================================================ 4. DEPOSITS
    public AdminDepositReportResponse buildDepositReport(PeriodQueryParams p) {
        Range r = PeriodRange.resolve(p);
        String f = fmt(p);

        BigDecimal collected = scalarSum(
                "SELECT COALESCE(SUM(amount_paid),0) FROM pm_deposit_payments WHERE status='PAID' AND paid_at BETWEEN :from AND :to", r);
        BigDecimal prevCollected = Boolean.TRUE.equals(p.getCompareWithPrevious())
                ? scalarSum("SELECT COALESCE(SUM(amount_paid),0) FROM pm_deposit_payments WHERE status='PAID' AND paid_at BETWEEN :from AND :to",
                        PeriodRange.resolvePrevious(p))
                : null;
        BigDecimal refunded = scalarSum(
                "SELECT COALESCE(SUM(amount),0) FROM pm_payout_orders WHERE state='SUCCEEDED' AND created_at BETWEEN :from AND :to", r);
        // Dùng updated_at (thời điểm status đổi sang CANCELLED_*/NO_SHOW, tức lúc penalty_amount
        // thực sự phát sinh) thay vì created_at (ngày đặt bàn được tạo) — created_at có thể ở kỳ
        // trước trong khi khoản phạt chỉ phát sinh khi khách huỷ trễ/no-show ở kỳ sau.
        BigDecimal penaltyHeld = scalarSum(
                "SELECT COALESCE(SUM(penalty_amount),0) FROM rs_reservations WHERE updated_at BETWEEN :from AND :to", r);
        long processingPayouts = scalarCount(
                "SELECT COUNT(*) FROM pm_payout_orders WHERE state='PROCESSING' AND created_at BETWEEN :from AND :to", r);

        List<KpiCard> kpis = List.of(
                kpi("totalCollected", "Tiền cọc đã thu", collected, prevCollected),
                kpi("totalRefunded", "Tiền đã hoàn", refunded, null),
                kpi("totalPenaltyHeld", "Tiền phạt giữ lại", penaltyHeld, null),
                kpi("processingPayoutCount", "Lệnh hoàn đang xử lý", BigDecimal.valueOf(processingPayouts), null)
        );

        Map<String, Map<String, BigDecimal>> acc = new TreeMap<>();
        addSeries(acc, "collected", queryList(
                "SELECT DATE_FORMAT(paid_at,'" + f + "') b, COALESCE(SUM(amount_paid),0) FROM pm_deposit_payments " +
                "WHERE status='PAID' AND paid_at BETWEEN :from AND :to GROUP BY b", r));
        // updated_at = lúc payout chuyển sang SUCCEEDED (khi tiền thực sự được hoàn),
        // không phải created_at (lúc lệnh chi được TẠO, còn ở state PROCESSING).
        addSeries(acc, "refunded", queryList(
                "SELECT DATE_FORMAT(updated_at,'" + f + "') b, COALESCE(SUM(amount),0) FROM pm_payout_orders " +
                "WHERE state='SUCCEEDED' AND updated_at BETWEEN :from AND :to GROUP BY b", r));
        addSeries(acc, "held", queryList(
                "SELECT DATE_FORMAT(updated_at,'" + f + "') b, COALESCE(SUM(penalty_amount),0) FROM rs_reservations " +
                "WHERE updated_at BETWEEN :from AND :to GROUP BY b", r));
        List<ChartPoint> cashflowByTime = new ArrayList<>();
        acc.forEach((bucket, series) -> cashflowByTime.add(ChartPoint.builder().label(bucket).series(series).build()));

        List<PieSlice> cashflowBreakdown = List.of(
                PieSlice.builder().label("collected").value(collected).build(),
                PieSlice.builder().label("refunded").value(refunded).build(),
                PieSlice.builder().label("held").value(penaltyHeld).build()
        );

        return AdminDepositReportResponse.builder()
                .kpis(kpis)
                .cashflowByTime(cashflowByTime)
                .cashflowBreakdown(cashflowBreakdown)
                .build();
    }

    // ============================================================ 5. USERS
    public AdminUserReportResponse buildUserReport(PeriodQueryParams p) {
        Range r = PeriodRange.resolve(p);
        String f = fmt(p);

        long newUsers = scalarCount(
                "SELECT COUNT(*) FROM id_users WHERE created_at BETWEEN :from AND :to", r);
        BigDecimal prev = Boolean.TRUE.equals(p.getCompareWithPrevious())
                ? BigDecimal.valueOf(scalarCount(
                        "SELECT COUNT(*) FROM id_users WHERE created_at BETWEEN :from AND :to",
                        PeriodRange.resolvePrevious(p)))
                : null;
        long totalUsers = asLong(em.createNativeQuery("SELECT COUNT(*) FROM id_users WHERE created_at <= :to")
                .setParameter("to", r.to()).getSingleResult());

        List<KpiCard> kpis = List.of(
                kpi("newUserCount", "Người dùng mới", BigDecimal.valueOf(newUsers), prev),
                kpi("totalUserCount", "Tổng người dùng", BigDecimal.valueOf(totalUsers), null)
        );

        List<ChartPoint> byTimeByRole = groupedSeries(
                "SELECT DATE_FORMAT(u.created_at,'" + f + "') b, ro.role_name, COUNT(*) " +
                "FROM id_users u JOIN id_user_roles ur ON ur.user_id = u.id " +
                "JOIN id_roles ro ON ro.id = ur.role_id " +
                "WHERE u.created_at BETWEEN :from AND :to " +
                "AND ro.role_name IN ('CUSTOMER','RESTAURANT_PARTNER') " +
                "GROUP BY b, ro.role_name ORDER BY b", r);

        return AdminUserReportResponse.builder()
                .kpis(kpis)
                .newUsersByTimeByRole(byTimeByRole)
                .build();
    }

    // ============================================================ helpers

    /** DAY/MONTH -> group theo ngày; QUARTER/YEAR -> group theo tháng. */
    private String fmt(PeriodQueryParams p) {
        ReportPeriod per = p.getPeriod() == null ? ReportPeriod.MONTH : p.getPeriod();
        return (per == ReportPeriod.QUARTER || per == ReportPeriod.YEAR) ? "%Y-%m" : "%Y-%m-%d";
    }

    private Query ranged(String sql, Range r) {
        return em.createNativeQuery(sql).setParameter("from", r.from()).setParameter("to", r.to());
    }

    private BigDecimal scalarSum(String sql, Range r) {
        return num(ranged(sql, r).getSingleResult());
    }

    private long scalarCount(String sql, Range r) {
        return asLong(ranged(sql, r).getSingleResult());
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> queryList(String sql, Range r) {
        return ranged(sql, r).getResultList();
    }

    private List<PieSlice> pieQuery(String sql, Range r) {
        List<PieSlice> out = new ArrayList<>();
        for (Object[] row : queryList(sql, r)) {
            out.add(PieSlice.builder()
                    .label(row[0] == null ? "" : row[0].toString())
                    .value(num(row[1]))
                    .build());
        }
        return out;
    }

    private List<ChartPoint> singleSeries(String sql, Range r) {
        List<ChartPoint> out = new ArrayList<>();
        for (Object[] row : queryList(sql, r)) {
            out.add(ChartPoint.builder()
                    .label(row[0] == null ? "" : row[0].toString())
                    .value(num(row[1]))
                    .build());
        }
        return out;
    }

    /** rows = (bucket, seriesKey, value) đã ORDER BY bucket. */
    private List<ChartPoint> groupedSeries(String sql, Range r) {
        Map<String, Map<String, BigDecimal>> byBucket = new LinkedHashMap<>();
        for (Object[] row : queryList(sql, r)) {
            String bucket = row[0] == null ? "" : row[0].toString();
            String key = row[1] == null ? "" : row[1].toString();
            byBucket.computeIfAbsent(bucket, k -> new LinkedHashMap<>()).merge(key, num(row[2]), BigDecimal::add);
        }
        List<ChartPoint> out = new ArrayList<>();
        byBucket.forEach((b, series) -> out.add(ChartPoint.builder().label(b).series(series).build()));
        return out;
    }

    /** Gộp 1 series (rows = bucket,value) vào accumulator dùng cho cashflow. */
    private void addSeries(Map<String, Map<String, BigDecimal>> acc, String seriesKey, List<Object[]> rows) {
        for (Object[] row : rows) {
            String bucket = row[0] == null ? "" : row[0].toString();
            acc.computeIfAbsent(bucket, k -> new LinkedHashMap<>()).merge(seriesKey, num(row[1]), BigDecimal::add);
        }
    }

    private KpiCard kpi(String key, String label, BigDecimal value, BigDecimal previous) {
        Double change = null;
        if (previous != null && previous.signum() != 0) {
            change = value.subtract(previous)
                    .divide(previous, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }
        return KpiCard.builder()
                .key(key).label(label)
                .value(value == null ? BigDecimal.ZERO : value)
                .previousValue(previous)
                .changePercent(change)
                .build();
    }

    /** part/total*100, guard total=0 -> 0. */
    private BigDecimal pct(BigDecimal part, BigDecimal total) {
        if (total == null || total.signum() == 0) return BigDecimal.ZERO;
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }

    // SUM(...) -> BigDecimal, COUNT(...) -> Long/BigInteger : ép qua Number, NULL -> 0.
    private static BigDecimal num(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal) return (BigDecimal) o;
        if (o instanceof BigInteger) return new BigDecimal((BigInteger) o);
        if (o instanceof Number) return BigDecimal.valueOf(((Number) o).doubleValue());
        return BigDecimal.ZERO;
    }

    private static long asLong(Object o) {
        return o == null ? 0L : ((Number) o).longValue();
    }
}
