package com.dabana.backend.modules.report.partner.export;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Xuất Excel báo cáo phía Partner theo type = REVENUE / DEPOSIT / INVOICE.
 * type = BOOKING vẫn do RestaurantService.exportToExcel xử lý như cũ (không đụng).
 * Chỉ dùng EntityManager native SQL — không phụ thuộc repository nào, owner-scope
 * bằng owner_user_id giống các endpoint /restaurants/me/** khác.
 */
@Service
public class ReportExcelExportService {

    @PersistenceContext
    private EntityManager em;

    public ByteArrayInputStream export(String type, Long ownerId, List<Long> branchIds,
                                       LocalDate from, LocalDate to) throws IOException {
        LocalDate start = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate end = to != null ? to : LocalDate.now();
        if (start.isAfter(end)) { LocalDate t = start; start = end; end = t; }
        LocalDateTime fromDt = start.atStartOfDay();
        LocalDateTime toDt = end.atTime(23, 59, 59);

        List<Long> ids = resolveOwnerBranchIds(ownerId, branchIds);

        try (Workbook wb = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            if (ids.isEmpty()) {
                wb.createSheet("No data").createRow(0).createCell(0).setCellValue("Không có chi nhánh");
            } else {
                switch (type == null ? "" : type.toUpperCase()) {
                    case "REVENUE" -> buildRevenueSheet(wb, ids, fromDt, toDt);
                    case "DEPOSIT" -> buildDepositSheet(wb, ids, fromDt, toDt);
                    case "INVOICE" -> buildInvoiceSheet(wb, ids, fromDt, toDt);
                    default -> wb.createSheet("Unsupported").createRow(0).createCell(0)
                            .setCellValue("type không hỗ trợ: " + type);
                }
            }
            wb.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    /** Trả các branchId hợp lệ của owner; nếu truyền branchId lạ (không thuộc owner) -> 403. */
    private List<Long> resolveOwnerBranchIds(Long ownerId, List<Long> requested) {
        @SuppressWarnings("unchecked")
        List<Number> owned = em.createNativeQuery(
                        "SELECT b.id FROM rt_branches b JOIN rt_restaurants r ON r.id = b.restaurant_id " +
                                "WHERE r.owner_user_id = :owner")
                .setParameter("owner", ownerId).getResultList();
        List<Long> ownedIds = owned.stream().map(Number::longValue).toList();
        if (requested == null || requested.isEmpty()) return ownedIds;
        for (Long req : requested) {
            if (!ownedIds.contains(req)) throw new AccessDeniedException("Chi nhánh không thuộc quyền quản lý");
        }
        return requested;
    }

    private void buildRevenueSheet(Workbook wb, List<Long> ids, LocalDateTime from, LocalDateTime to) {
        Sheet sheet = wb.createSheet("Doanh thu");
        header(wb, sheet, "Chi nhánh", "Doanh thu", "Món đặt trước", "Gọi thêm", "Phụ thu", "Số hoá đơn");
        Query q = em.createNativeQuery(
                "SELECT b.branch_name, COALESCE(SUM(i.grand_total),0), COALESCE(SUM(i.preorder_subtotal),0), " +
                        "COALESCE(SUM(i.extra_order_subtotal),0), COALESCE(SUM(i.surcharge),0), COUNT(*) " +
                        "FROM rs_invoices i JOIN rs_reservations r ON r.id = i.reservation_id " +
                        "JOIN rt_branches b ON b.id = r.branch_id " +
                        "WHERE i.status='PAID' AND i.paid_at BETWEEN :from AND :to AND r.branch_id IN (:ids) " +
                        "GROUP BY b.id, b.branch_name ORDER BY 2 DESC");
        bind(q, from, to, ids);
        int r = 1;
        for (Object[] row : rows(q)) {
            Row x = sheet.createRow(r++);
            x.createCell(0).setCellValue(str(row[0]));
            x.createCell(1).setCellValue(num(row[1]));
            x.createCell(2).setCellValue(num(row[2]));
            x.createCell(3).setCellValue(num(row[3]));
            x.createCell(4).setCellValue(num(row[4]));
            x.createCell(5).setCellValue(num(row[5]));
        }
    }

    private void buildDepositSheet(Workbook wb, List<Long> ids, LocalDateTime from, LocalDateTime to) {
        Sheet sheet = wb.createSheet("Tiền cọc");
        header(wb, sheet, "Chi nhánh", "Đã thu", "Đã hoàn", "Giữ lại (phạt)");

        Map<Long, String> names = new LinkedHashMap<>();
        Query qn = em.createNativeQuery("SELECT id, branch_name FROM rt_branches WHERE id IN (:ids)");
        qn.setParameter("ids", ids);
        for (Object[] row : rows(qn)) names.put(((Number) row[0]).longValue(), str(row[1]));

        Map<Long, Double> collected = sumByBranch(
                "SELECT a.branch_id, COALESCE(SUM(d.amount_paid),0) FROM pm_deposit_payments d " +
                        "JOIN pm_branch_bank_accounts a ON a.id = d.branch_bank_account_id " +
                        "WHERE d.status='PAID' AND d.paid_at BETWEEN :from AND :to AND a.branch_id IN (:ids) " +
                        "GROUP BY a.branch_id", ids, from, to);
        Map<Long, Double> refunded = sumByBranch(
                "SELECT a.branch_id, COALESCE(SUM(p.amount),0) FROM pm_payout_orders p " +
                        "JOIN pm_branch_bank_accounts a ON a.id = p.source_branch_bank_account_id " +
                        "WHERE p.state='SUCCEEDED' AND p.created_at BETWEEN :from AND :to AND a.branch_id IN (:ids) " +
                        "GROUP BY a.branch_id", ids, from, to);
        Map<Long, Double> held = sumByBranch(
                "SELECT r.branch_id, COALESCE(SUM(r.penalty_amount),0) FROM rs_reservations r " +
                        "WHERE r.created_at BETWEEN :from AND :to AND r.branch_id IN (:ids) " +
                        "GROUP BY r.branch_id", ids, from, to);

        int r = 1;
        for (Long id : ids) {
            Row x = sheet.createRow(r++);
            x.createCell(0).setCellValue(names.getOrDefault(id, String.valueOf(id)));
            x.createCell(1).setCellValue(collected.getOrDefault(id, 0.0));
            x.createCell(2).setCellValue(refunded.getOrDefault(id, 0.0));
            x.createCell(3).setCellValue(held.getOrDefault(id, 0.0));
        }
    }

    private void buildInvoiceSheet(Workbook wb, List<Long> ids, LocalDateTime from, LocalDateTime to) {
        Sheet sheet = wb.createSheet("Hoá đơn");
        header(wb, sheet, "Mã HĐ", "Chi nhánh", "Tổng tiền", "Trạng thái", "Thanh toán", "Ngày tạo");
        Query q = em.createNativeQuery(
                "SELECT i.id, b.branch_name, i.grand_total, i.status, i.payment_method, i.created_at " +
                        "FROM rs_invoices i JOIN rs_reservations r ON r.id = i.reservation_id " +
                        "JOIN rt_branches b ON b.id = r.branch_id " +
                        "WHERE r.branch_id IN (:ids) AND i.created_at BETWEEN :from AND :to " +
                        "ORDER BY i.created_at DESC");
        bind(q, from, to, ids);
        int r = 1;
        for (Object[] row : rows(q)) {
            Row x = sheet.createRow(r++);
            x.createCell(0).setCellValue(str(row[0]));
            x.createCell(1).setCellValue(str(row[1]));
            x.createCell(2).setCellValue(num(row[2]));
            x.createCell(3).setCellValue(str(row[3]));
            x.createCell(4).setCellValue(str(row[4]));
            x.createCell(5).setCellValue(str(row[5]));
        }
    }

    // ---- helpers ----
    private Map<Long, Double> sumByBranch(String sql, List<Long> ids, LocalDateTime from, LocalDateTime to) {
        Query q = em.createNativeQuery(sql);
        bind(q, from, to, ids);
        Map<Long, Double> map = new HashMap<>();
        for (Object[] row : rows(q)) map.put(((Number) row[0]).longValue(), num(row[1]));
        return map;
    }

    private void bind(Query q, LocalDateTime from, LocalDateTime to, List<Long> ids) {
        q.setParameter("from", from);
        q.setParameter("to", to);
        q.setParameter("ids", ids);
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> rows(Query q) {
        return q.getResultList();
    }

    private void header(Workbook wb, Sheet sheet, String... cols) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        Row row = sheet.createRow(0);
        for (int i = 0; i < cols.length; i++) {
            Cell c = row.createCell(i);
            c.setCellValue(cols[i]);
            c.setCellStyle(style);
            sheet.setColumnWidth(i, 20 * 256);
        }
    }

    private double num(Object o) {
        return o instanceof Number n ? n.doubleValue() : 0.0;
    }

    private String str(Object o) {
        return o == null ? "" : o.toString();
    }
}
