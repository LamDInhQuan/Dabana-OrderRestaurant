package com.dabana.backend.modules.invoice.util;

/**
 * Phuong thuc nhan vien thu tien khi thanh toan hoa don cuoi buoi
 * (khac voi pm_deposit_payments - la tien coc thu truoc qua payOS).
 * Khop voi cot rs_invoices.payment_method (them boi migration
 * migration_add_invoice_payment_fields.sql).
 */
public enum InvoicePaymentMethod {
    CASH,       // Tien mat
    TRANSFER    // Chuyen khoan / quet QR tai quay
}
