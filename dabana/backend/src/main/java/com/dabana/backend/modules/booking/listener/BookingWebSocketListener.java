package com.dabana.backend.modules.booking.listener;

import com.dabana.backend.modules.booking.event.BookingChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingWebSocketListener {

    // Kênh realtime dành riêng cho nhà hàng theo từng chi nhánh
    private static final String BRANCH_TOPIC_PREFIX = "/topic/branch/";

    // Kênh realtime dành riêng cho khách hàng cá nhân
    private static final String USER_TOPIC_PREFIX = "/topic/user/";

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingChanged(BookingChangedEvent event) {
        if (event.getBranchId() == null && event.getUserId() == null) {
            return;
        }
        try {
            // 1. Broadcast cập nhật cho phía Nhà hàng (quản lý đặt bàn tại chi nhánh)
            if (event.getBranchId() != null) {
                messagingTemplate.convertAndSend(
                        BRANCH_TOPIC_PREFIX + event.getBranchId() + "/bookings",
                        event.getBookingId()
                );
            }

            // 2. Broadcast cập nhật cho riêng Khách hàng (nếu có userId)
            if (event.getUserId() != null) {
                messagingTemplate.convertAndSend(
                        USER_TOPIC_PREFIX + event.getUserId() + "/bookings",
                        event.getBookingId()
                );
            }
        } catch (Exception ex) {
            log.error("Khong the broadcast booking realtime cho bookingId={}", event.getBookingId(), ex);
        }
    }
}