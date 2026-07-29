package com.dabana.backend.modules.booking.event;

/**
 * Domain event (Spring ApplicationEvent) noi bo, publish tu BookingService.cancel()
 * NGAY SAU KHI da tinh xong refundAmount/refundStatus=PENDING theo policySnapshot,
 * de kich hoat tu dong tao lenh chi hoan coc qua payOS (PayoutOrderService)
 * MA KHONG can nhan vien bam nut thu cong.
 *
 * Chi mang bookingId (khong mang entity JPA) - giong TableBoardChangedEvent (module
 * orderboard) - de tranh lazy-loading exception khi listener chay o pha AFTER_COMMIT
 * (transaction goc co the da dong, entity cu co the stale).
 *
 * Listener: PayoutAutoCreateListener (module payment) - dung @TransactionalEventListener
 * (phase = AFTER_COMMIT) de dam bao chi tao lenh chi SAU KHI booking.cancel() da
 * commit thanh cong, tranh tao lenh chi cho 1 giao dich huy roi lai bi rollback.
 */
public class BookingCancelledForRefundEvent {

    private final Long bookingId;

    public BookingCancelledForRefundEvent(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getBookingId() {
        return bookingId;
    }
}