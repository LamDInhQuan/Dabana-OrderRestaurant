package com.dabana.backend.modules.report.partner.service;

import com.dabana.backend.modules.report.dto.ChartPoint;
import com.dabana.backend.modules.report.dto.KpiCard;
import com.dabana.backend.modules.report.dto.PeriodQueryParams;
import com.dabana.backend.modules.report.dto.PieSlice;
import com.dabana.backend.modules.report.partner.dto.PartnerDepositReportResponse;
import com.dabana.backend.modules.report.partner.dto.PartnerReservationReportResponse;
import com.dabana.backend.modules.report.partner.dto.PartnerRevenueReportResponse;
import com.dabana.backend.modules.report.partner.dto.PeakHourResponse;
import com.dabana.backend.modules.report.partner.util.PartnerBranchAccessGuard;
import com.dabana.backend.modules.report.util.PeriodRange;
import com.dabana.backend.modules.report.util.ReportPeriod;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Bao cao doi tac: doc so lieu tong hop that bang native MySQL, scope theo cac
 * branch_id ma owner duoc phep (guard). Khong bao gio 500: neu owner khong co
 * branch nao -> tra ve list rong.
 */
@Service
@RequiredArgsConstructor
public class PartnerReportService {

    @PersistenceContext
    private EntityManager em;

    private final PartnerBranchAccessGuard guard;

    // ==================================================================
    //  REVENUE
    // ==================================================================
    public PartnerRevenueReportResponse revenue(Long ownerId, Long branchId, PeriodQueryParams params) {
            List<Long> ids = guard.resolveAccessibleBranchIds(ownerId, branchId);
            if (ids.isEmpty()) {
                    return PartnerRevenueReportResponse.builder()
                                    .kpis(List.of()).revenueByTime(List.of())
                                    .revenueComposition(List.of()).paymentMethodBreakdown(List.of())
                                    .topCashiers(List.of()).build();
            }
            PeriodRange.Range r = PeriodRange.resolve(params);

            String paidFilter = "i.status='PAID' AND i.paid_at BETWEEN :from AND :to AND r.branch_id IN (:branchIds)";
            BigDecimal totalRevenue = scalar(
                            "SELECT COALESCE(SUM(i.grand_total),0) FROM rs_invoices i "
                                            + "JOIN rs_reservations r ON r.id=i.reservation_id WHERE " + paidFilter,
                            r, ids);
            BigDecimal avgInvoice = scalar(
                            "SELECT COALESCE(AVG(i.grand_total),0) FROM rs_invoices i "
                                            + "JOIN rs_reservations r ON r.id=i.reservation_id WHERE " + paidFilter,
                            r, ids);
            BigDecimal unpaidCount = scalar(
                            "SELECT COUNT(*) FROM rs_invoices i JOIN rs_reservations r ON r.id=i.reservation_id "
                                            + "WHERE i.status='UNPAID' AND i.created_at BETWEEN :from AND :to AND r.branch_id IN (:branchIds)",
                            r, ids);

            List<KpiCard> kpis = new ArrayList<>();
            KpiCard revenueCard = card("totalRevenue", "Doanh thu", totalRevenue);
            if (Boolean.TRUE.equals(params.getCompareWithPrevious())) {
                    PeriodRange.Range prev = PeriodRange.resolvePrevious(params);
                    BigDecimal prevRevenue = scalar(
                                    "SELECT COALESCE(SUM(i.grand_total),0) FROM rs_invoices i "
                                                    + "JOIN rs_reservations r ON r.id=i.reservation_id WHERE "
                                                    + paidFilter,
                                    prev, ids);
                    applyComparison(revenueCard, prevRevenue);
            }
            kpis.add(revenueCard);
            kpis.add(card("avgInvoiceValue", "Gia tri hoa don trung binh", avgInvoice));
            kpis.add(card("unpaidInvoiceCount", "So hoa don chua thanh toan", unpaidCount));

            // revenueByTime
            String fmt = timeFormat(params);
            List<ChartPoint> revenueByTime;
            if (branchId == null) {
                    List<Object[]> rows = rows(
                                    "SELECT DATE_FORMAT(i.paid_at,'" + fmt
                                                    + "') lbl, b.branch_name, COALESCE(SUM(i.grand_total),0) "
                                                    + "FROM rs_invoices i JOIN rs_reservations r ON r.id=i.reservation_id "
                                                    + "JOIN rt_branches b ON b.id=r.branch_id WHERE " + paidFilter
                                                    + " GROUP BY lbl, b.branch_name ORDER BY lbl",
                                    r, ids);
                    Map<String, ChartPoint> byLabel = new LinkedHashMap<>();
                    for (Object[] row : rows) {
                            String lbl = (String) row[0];
                            ChartPoint cp = byLabel.computeIfAbsent(lbl,
                                            l -> ChartPoint.builder().label(l).series(new LinkedHashMap<>()).build());
                            cp.getSeries().put((String) row[1], bd(row[2]));
                    }
                    revenueByTime = new ArrayList<>(byLabel.values());
            } else {
                    List<Object[]> rows = rows(
                                    "SELECT DATE_FORMAT(i.paid_at,'" + fmt + "') lbl, COALESCE(SUM(i.grand_total),0) "
                                                    + "FROM rs_invoices i JOIN rs_reservations r ON r.id=i.reservation_id WHERE "
                                                    + paidFilter
                                                    + " GROUP BY lbl ORDER BY lbl",
                                    r, ids);
                    revenueByTime = new ArrayList<>();
                    for (Object[] row : rows) {
                            revenueByTime.add(ChartPoint.builder().label((String) row[0]).value(bd(row[1])).build());
                    }
            }

            // revenueComposition pie
            Object[] comp = rows(
                            "SELECT COALESCE(SUM(i.preorder_subtotal),0), COALESCE(SUM(i.extra_order_subtotal),0), "
                                            + "COALESCE(SUM(i.surcharge),0) FROM rs_invoices i "
                                            + "JOIN rs_reservations r ON r.id=i.reservation_id WHERE " + paidFilter,
                            r, ids).get(0);
            List<PieSlice> composition = List.of(
                            slice("Dat truoc", bd(comp[0])),
                            slice("Goi them", bd(comp[1])),
                            slice("Phu thu", bd(comp[2])));

            // paymentMethodBreakdown pie
            List<PieSlice> payment = new ArrayList<>();
            for (Object[] row : rows(
                            "SELECT i.payment_method, COALESCE(SUM(i.grand_total),0) FROM rs_invoices i "
                                            + "JOIN rs_reservations r ON r.id=i.reservation_id WHERE " + paidFilter
                                            + " GROUP BY i.payment_method",
                            r, ids)) {
                    payment.add(slice((String) row[0], bd(row[1])));
            }
            payment.forEach(p -> {
                p.setLabel(paymentLabelConvert(p.getLabel()));
            });
            // Top thu ngan: cung branch ids + range, chi hoa don PAID.
            List<PartnerRevenueReportResponse.CashierRow> topCashiers = new ArrayList<>();
            for (Object[] row : rows(
                            "SELECT i.collected_by_user_id, u.full_name, COUNT(*), COALESCE(SUM(i.grand_total),0) "
                                            + "FROM rs_invoices i JOIN rs_reservations res ON res.id=i.reservation_id "
                                            + "JOIN id_users u ON u.id=i.collected_by_user_id "
                                            + "WHERE i.status='PAID' AND i.paid_at BETWEEN :from AND :to AND res.branch_id IN (:branchIds) "
                                            + "AND i.collected_by_user_id IS NOT NULL "
                                            + "GROUP BY i.collected_by_user_id, u.full_name ORDER BY 4 DESC LIMIT 10",
                            r, ids)) {
                    topCashiers.add(PartnerRevenueReportResponse.CashierRow.builder()
                                    .userId(((Number) row[0]).longValue())
                                    .cashierName(row[1] == null ? "" : row[1].toString())
                                    .invoiceCount(((Number) row[2]).longValue())
                                    .totalCollected(bd(row[3]))
                                    .build());
            }

            return PartnerRevenueReportResponse.builder()
                            .kpis(kpis).revenueByTime(revenueByTime)
                            .revenueComposition(composition).paymentMethodBreakdown(payment)
                            .topCashiers(topCashiers).build();
    }

    private String paymentLabelConvert(String label) {
        switch (label) {
                case "CASH":
                        return "Tiền mặt";
                case "TRANSFER":
                        return "Chuyển khoản";
                default:
                        return "chưa sửa" + label;
        }
    }

    // ==================================================================
    //  DEPOSITS / CASHFLOW
    // ==================================================================
    public PartnerDepositReportResponse deposits(Long ownerId, Long branchId, PeriodQueryParams params) {
            List<Long> ids = guard.resolveAccessibleBranchIds(ownerId, branchId);
            if (ids.isEmpty()) {
                    return PartnerDepositReportResponse.builder()
                                    .kpis(List.of()).cashflowByTime(List.of()).depositProcessingBreakdown(List.of())
                                    .build();
            }
            PeriodRange.Range r = PeriodRange.resolve(params);
            String fmt = timeFormat(params);

            BigDecimal collected = scalar(
                            "SELECT COALESCE(SUM(d.amount_paid),0) FROM pm_deposit_payments d "
                                            + "JOIN pm_branch_bank_accounts a ON a.id=d.branch_bank_account_id "
                                            + "WHERE d.status='PAID' AND d.paid_at BETWEEN :from AND :to AND a.branch_id IN (:branchIds)",
                            r, ids);
            BigDecimal refunded = scalar(
                            "SELECT COALESCE(SUM(p.amount),0) FROM pm_payout_orders p "
                                            + "JOIN pm_branch_bank_accounts a ON a.id=p.source_branch_bank_account_id "
                                            + "WHERE p.state='SUCCEEDED' AND p.created_at BETWEEN :from AND :to AND a.branch_id IN (:branchIds)",
                            r, ids);
            BigDecimal held = scalar(
                            "SELECT COALESCE(SUM(r.penalty_amount),0) FROM rs_reservations r "
                                            + "WHERE r.reservation_time BETWEEN :from AND :to AND r.branch_id IN (:branchIds)",
                            r, ids);
            BigDecimal pendingRes = scalar(
                            "SELECT COUNT(*) FROM rs_reservations r WHERE r.refund_status='PENDING' "
                                            + "AND r.reservation_time BETWEEN :from AND :to AND r.branch_id IN (:branchIds)",
                            r, ids);
            BigDecimal pendingPayout = scalar(
                            "SELECT COUNT(*) FROM pm_payout_orders p "
                                            + "JOIN pm_branch_bank_accounts a ON a.id=p.source_branch_bank_account_id "
                                            + "WHERE p.state='PROCESSING' AND p.created_at BETWEEN :from AND :to AND a.branch_id IN (:branchIds)",
                            r, ids);

            List<KpiCard> kpis = List.of(
                            card("totalCollected", "Tong tien coc da thu", collected),
                            card("totalRefunded", "Tong tien da hoan", refunded),
                            card("totalHeld", "Tong tien phat giu lai", held),
                            card("pendingRefundCount", "So khoan cho hoan", pendingRes.add(pendingPayout)));

            // cashflowByTime series collected/refunded/held
            Map<String, Map<String, BigDecimal>> byLabel = new TreeMap<>();
            for (Object[] row : rows(
                            "SELECT DATE_FORMAT(d.paid_at,'" + fmt
                                            + "') lbl, COALESCE(SUM(d.amount_paid),0) FROM pm_deposit_payments d "
                                            + "JOIN pm_branch_bank_accounts a ON a.id=d.branch_bank_account_id "
                                            + "WHERE d.status='PAID' AND d.paid_at BETWEEN :from AND :to AND a.branch_id IN (:branchIds) "
                                            + "GROUP BY lbl",
                            r, ids)) {
                    series(byLabel, (String) row[0], "collected", bd(row[1]));
            }
            for (Object[] row : rows(
                            "SELECT DATE_FORMAT(p.created_at,'" + fmt
                                            + "') lbl, COALESCE(SUM(p.amount),0) FROM pm_payout_orders p "
                                            + "JOIN pm_branch_bank_accounts a ON a.id=p.source_branch_bank_account_id "
                                            + "WHERE p.state='SUCCEEDED' AND p.created_at BETWEEN :from AND :to AND a.branch_id IN (:branchIds) "
                                            + "GROUP BY lbl",
                            r, ids)) {
                    series(byLabel, (String) row[0], "refunded", bd(row[1]));
            }
            for (Object[] row : rows(
                            "SELECT DATE_FORMAT(r.reservation_time,'" + fmt
                                            + "') lbl, COALESCE(SUM(r.penalty_amount),0) FROM rs_reservations r "
                                            + "WHERE r.reservation_time BETWEEN :from AND :to AND r.branch_id IN (:branchIds) "
                                            + "GROUP BY lbl",
                            r, ids)) {
                    series(byLabel, (String) row[0], "held", bd(row[1]));
            }
            List<ChartPoint> cashflow = new ArrayList<>();
            byLabel.forEach((lbl, s) -> cashflow.add(ChartPoint.builder().label(lbl).series(s).build()));

            // depositProcessingBreakdown pie (so luong ban ghi coc theo trang thai)
            List<PieSlice> processing = new ArrayList<>();
            for (Object[] row : rows(
                            "SELECT d.status, COUNT(*) FROM pm_deposit_payments d "
                                            + "JOIN pm_branch_bank_accounts a ON a.id=d.branch_bank_account_id "
                                            + "WHERE d.created_at BETWEEN :from AND :to AND a.branch_id IN (:branchIds) "
                                            + "GROUP BY d.status",
                            r, ids)) {
                    processing.add(slice((String) row[0], bd(row[1])));
            }
            // label is kept as raw enum string

            return PartnerDepositReportResponse.builder()
                            .kpis(kpis).cashflowByTime(cashflow).depositProcessingBreakdown(processing).build();
    }



    // ==================================================================
    //  RESERVATIONS
    // ==================================================================
    public PartnerReservationReportResponse reservations(Long ownerId, Long branchId, PeriodQueryParams params) {
            List<Long> ids = guard.resolveAccessibleBranchIds(ownerId, branchId);
            if (ids.isEmpty()) {
                    return PartnerReservationReportResponse.builder()
                                    .kpis(List.of()).reservationsByTime(List.of()).statusBreakdown(List.of()).build();
            }
            PeriodRange.Range r = PeriodRange.resolve(params);
            String base = " FROM rs_reservations r WHERE r.reservation_time BETWEEN :from AND :to AND r.branch_id IN (:branchIds)";

            BigDecimal total = scalar("SELECT COUNT(*)" + base, r, ids);
            BigDecimal served = scalar(
                            "SELECT COALESCE(SUM(r.guest_count),0)" + base
                                            + " AND r.status IN ('COMPLETED','CHECKED_IN')",
                            r, ids);
            BigDecimal noShow = scalar("SELECT COUNT(*)" + base + " AND r.status='NO_SHOW'", r, ids);
            BigDecimal noShowRate = total.signum() == 0
                            ? BigDecimal.ZERO
                            : noShow.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);

            List<KpiCard> kpis = new ArrayList<>();
            KpiCard totalCard = card("totalReservations", "Tong luot dat", total);
            if (Boolean.TRUE.equals(params.getCompareWithPrevious())) {
                    PeriodRange.Range prev = PeriodRange.resolvePrevious(params);
                    BigDecimal prevTotal = scalar("SELECT COUNT(*)" + base, prev, ids);
                    applyComparison(totalCard, prevTotal);
            }
            kpis.add(totalCard);
            kpis.add(card("servedGuestCount", "So khach da phuc vu", served));
            kpis.add(card("noShowRate", "Ty le khong den (%)", noShowRate));

            // reservationsByTime
            String fmt = timeFormat(params);
            List<ChartPoint> byTime = new ArrayList<>();
            for (Object[] row : rows(
                            "SELECT DATE_FORMAT(r.reservation_time,'" + fmt + "') lbl, COUNT(*)" + base
                                            + " GROUP BY lbl ORDER BY lbl",
                            r, ids)) {
                    byTime.add(ChartPoint.builder().label((String) row[0]).value(bd(row[1])).build());
            }

            // statusBreakdown pie
            List<PieSlice> status = new ArrayList<>();
            for (Object[] row : rows("SELECT r.status, COUNT(*)" + base + " GROUP BY r.status", r, ids)) {
                    status.add(slice((String) row[0], bd(row[1])));
            }
            // label is kept as raw enum string

            return PartnerReservationReportResponse.builder()
                            .kpis(kpis).reservationsByTime(byTime).statusBreakdown(status).build();
    }

    

    // ==================================================================
    //  PEAK HOURS
    // ==================================================================
    private static final String[] DOW = { "", "CN", "T2", "T3", "T4", "T5", "T6", "T7" }; // MySQL DAYOFWEEK 1=Sun..7=Sat

    

    public PeakHourResponse peakHours(Long ownerId, Long branchId, PeriodQueryParams params) {
        List<Long> ids = guard.resolveAccessibleBranchIds(ownerId, branchId);
        if (ids.isEmpty()) {
            return PeakHourResponse.builder().byHour(List.of()).byDayOfWeek(List.of()).build();
        }
        PeriodRange.Range r = PeriodRange.resolve(params);
        String base = " FROM rs_reservations r WHERE r.reservation_time BETWEEN :from AND :to AND r.branch_id IN (:branchIds)";

        List<ChartPoint> byHour = new ArrayList<>();
        for (Object[] row : rows(
                "SELECT HOUR(r.reservation_time) h, COUNT(*)" + base + " GROUP BY h ORDER BY h", r, ids)) {
            byHour.add(ChartPoint.builder().label(((Number) row[0]).intValue() + "h").value(bd(row[1])).build());
        }

        List<ChartPoint> byDayOfWeek = new ArrayList<>();
        for (Object[] row : rows(
                "SELECT DAYOFWEEK(r.reservation_time) d, COUNT(*)" + base + " GROUP BY d ORDER BY d", r, ids)) {
            int d = ((Number) row[0]).intValue();
            String label = (d >= 1 && d <= 7) ? DOW[d] : String.valueOf(d);
            byDayOfWeek.add(ChartPoint.builder().label(label).value(bd(row[1])).build());
        }

        return PeakHourResponse.builder().byHour(byHour).byDayOfWeek(byDayOfWeek).build();
    }

    // ==================================================================
    //  helpers
    // ==================================================================
    private Query bind(String sql, PeriodRange.Range r, List<Long> ids) {
        return em.createNativeQuery(sql)
                .setParameter("from", r.from())
                .setParameter("to", r.to())
                .setParameter("branchIds", ids);
    }

    private BigDecimal scalar(String sql, PeriodRange.Range r, List<Long> ids) {
        return bd(bind(sql, r, ids).getSingleResult());
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> rows(String sql, PeriodRange.Range r, List<Long> ids) {
        return bind(sql, r, ids).getResultList();
    }

    private static void series(Map<String, Map<String, BigDecimal>> byLabel, String lbl, String key, BigDecimal val) {
        byLabel.computeIfAbsent(lbl, l -> new LinkedHashMap<>()).put(key, val);
    }

    private static BigDecimal bd(Object o) {
        return o == null ? BigDecimal.ZERO : new BigDecimal(((Number) o).toString());
    }

    private static KpiCard card(String key, String label, BigDecimal value) {
        return KpiCard.builder().key(key).label(label).value(value == null ? BigDecimal.ZERO : value).build();
    }

    private static void applyComparison(KpiCard card, BigDecimal previous) {
        card.setPreviousValue(previous == null ? BigDecimal.ZERO : previous);
        if (previous == null || previous.signum() == 0) {
            card.setChangePercent(null);
        } else {
            card.setChangePercent(card.getValue().subtract(previous)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(previous, 2, RoundingMode.HALF_UP)
                    .doubleValue());
        }
    }

    private static PieSlice slice(String label, BigDecimal value) {
        return PieSlice.builder().label(label).value(value).build();
    }

    private static String timeFormat(PeriodQueryParams params) {
        ReportPeriod p = params.getPeriod();
        return (p == ReportPeriod.QUARTER || p == ReportPeriod.YEAR) ? "%Y-%m" : "%Y-%m-%d";
    }
}
