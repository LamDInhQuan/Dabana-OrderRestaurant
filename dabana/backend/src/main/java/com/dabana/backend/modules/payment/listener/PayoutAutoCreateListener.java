package com.dabana.backend.modules.payment.listener;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.event.BookingCancelledForRefundEvent;
import com.dabana.backend.modules.payment.dto.request.CreatePayoutOrderRequest;
import com.dabana.backend.modules.payment.service.PayoutOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Cau noi giua nghiep vu huy don (BookingService.cancel()) va tao lenh chi hoan
 * coc qua payOS (PayoutOrderService) - tu dong hoa toan bo, KHONG can nhan vien
 * bam nut thu cong nua.
 *
 * Dung @TransactionalEventListener (mac dinh phase = AFTER_COMMIT), GIONG HET
 * pattern cua OrderBoardWebSocketListener (module orderboard), vi 2 ly do:
 * 1) Chi goi payOS (mot loi call ngoai, khong the rollback) SAU KHI booking da
 *    thuc su CANCELLED va refundAmount da commit xong trong DB - tranh tao lenh
 *    chi cho mot giao dich huy roi cuoi cung lai bi rollback vi loi khac.
 * 2) Neu goi payOS THAT BAI (vd chua co RefundBankInfo, mat mang, payOS down),
 *    KHONG duoc anh huong nguoc lai giao dich huy don (da commit roi) - chi log
 *    loi va giu booking.refundStatus=PENDING de retry sau (thu cong qua
 *    POST /api/payment/payouts, hoac co the bo sung retry job rieng sau nay).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PayoutAutoCreateListener {

    private final PayoutOrderService payoutOrderService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCancelledForRefund(BookingCancelledForRefundEvent event) {
        if (event.getBookingId() == null) {
            return;
        }
        try {
            CreatePayoutOrderRequest request = new CreatePayoutOrderRequest();
            request.setReservationId(event.getBookingId());
            // requestedBy = null: lenh chi nay do HE THONG tu tao (khong phai nhan
            // vien bam tay) - cot requested_by_user_id cho phep null.
            payoutOrderService.createPayoutOrder(request, null);
            log.info("Tu dong tao lenh chi hoan coc thanh cong cho bookingId={}", event.getBookingId());
        } catch (BusinessException e) {
            // Vd REFUND_BANK_INFO_NOT_FOUND (khach chua nhap tk nhan hoan tien),
            // PAYOUT_ALREADY_EXISTS (da tao roi, tranh trung), REFUND_AMOUNT_ZERO...
            // - deu la loi nghiep vu du kien duoc, khong phai bug, chi log de theo doi.
            log.warn("Khong the tu dong tao lenh chi hoan coc cho bookingId={}: {}",
                    event.getBookingId(), e.getMessage());
        } catch (Exception e) {
            log.error("Loi khong xac dinh khi tu dong tao lenh chi hoan coc cho bookingId={}",
                    event.getBookingId(), e);
        }
    }
}