package com.dabana.backend.modules.invoice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Xem truoc hoa don TRUOC khi nhan vien bam xac nhan thanh toan (khong ghi
 * DB). Dung cho GET /api/bookings/{id}/invoice/preview de hien thi breakdown
 * tren modal "Thanh toan hoa don" o FE.
 */
@Data
@Builder
public class InvoicePreviewResponse {

    private Long bookingId;

    private List<LineItem> preorderItems;
    private List<LineItem> extraOrderItems;

    private BigDecimal preorderSubtotal;
    private BigDecimal extraOrderSubtotal;

    /** Tien coc da thu truoc (neu co) qua pm_deposit_payments, se duoc tru vao so tien phai thu. */
    private BigDecimal depositPaid;

    /** = preorderSubtotal + extraOrderSubtotal (chua tru coc, chua tinh phu thu - phu thu FE tu nhap luc xac nhan). */
    private BigDecimal subtotalBeforeSurcharge;

    /** = subtotalBeforeSurcharge - depositPaid (goi y so tien can thu, phu thu = 0). FE co the cong them phu thu truoc khi xac nhan. */
    private BigDecimal amountDueBeforeSurcharge;

    @Data
    @Builder
    public static class LineItem {
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
