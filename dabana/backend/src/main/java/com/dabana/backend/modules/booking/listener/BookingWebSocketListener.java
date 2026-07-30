package com.dabana.backend.modules.booking.listener;

import com.dabana.backend.modules.booking.event.BookingTableChangedEvent;
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
    public void onBookingChanged(BookingTableChangedEvent event) {
        try {
            // 1. Broadcast cập nhật cho phía Nhà hàng (quản lý đặt bàn tại chi nhánh)
            // 1. Broadcast cho phía Nhà hàng (quản lý đặt bàn)
            if (event.getBranchId() != null) {
                messagingTemplate.convertAndSend(
                        BRANCH_TOPIC_PREFIX + event.getBranchId() + "/bookings",
                        event.getBookingId()
                );

                // 🚀 2. Broadcast thông báo cập nhật sơ đồ bàn cho TẤT CẢ khách hàng
                // đang xem sơ đồ/chọn bàn tại chi nhánh này
                messagingTemplate.convertAndSend(
                        BRANCH_TOPIC_PREFIX + event.getBranchId() + "/tables-update",
                        event // Hoặc truyền thêm danh sách tableIds bị ảnh hưởng nếu cần
                );
            }
        } catch (Exception ex) {
            log.error("Khong the broadcast booking realtime cho bookingId={}", event.getBookingId(), ex);
        }
    }
}