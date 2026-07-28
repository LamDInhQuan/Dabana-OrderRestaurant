package com.dabana.backend.modules.invoice.util;

/**
 * Trang thai hoa don (rs_invoices.status). Hien tai InvoiceService chi tao
 * hoa don tai thoi diem nhan vien xac nhan thu tien xong (luon la PAID ngay
 * khi insert), nhung giu du 2 gia tri de mo rong sau nay (vd: cho phep tao
 * hoa don truoc, thu tien sau).
 */
public enum InvoiceStatus {
    UNPAID,
    PAID
}
