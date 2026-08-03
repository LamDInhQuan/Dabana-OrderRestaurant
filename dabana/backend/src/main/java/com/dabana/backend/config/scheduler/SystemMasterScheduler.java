package com.dabana.backend.config.scheduler;

import com.dabana.backend.modules.booking.service.BookingService;
import com.dabana.backend.modules.diningtable.service.IDiningTableService;
import com.dabana.backend.modules.notification.NotificationService;
import com.dabana.backend.modules.payment.service.PayoutOrderService;
import com.dabana.backend.modules.subscription.scheduler.SubscriptionBillingScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Master Scheduler tập trung quản lý toàn bộ các tác vụ định kỳ trong hệ thống.
 * 
 * Ưu điểm:
 * 1. Chạy tuần tự trên 1 luồng (single thread), chỉ chiếm tối đa 1 connection
 * DB tại một thời điểm.
 * 2. Tránh cạn kiệt Connection Pool (HikariCP) và giảm tải CPU/RAM cho VPS.
 * 3. Bọc try-catch độc lập cho từng tác vụ để tránh 1 lỗi làm gián đoạn toàn bộ
 * hệ thống.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SystemMasterScheduler {

    private final BookingService bookingService;
    private final IDiningTableService diningTableService;
    private final PayoutOrderService payoutOrderService;
    private final NotificationService notificationService;
    private final SubscriptionBillingScheduler subscriptionBillingScheduler;

    /**
     * Tác vụ thời gian thực: Chạy mỗi 60 giây (bắt đầu sau khi server khởi động 10
     * giây).
     */
    @Scheduled(fixedRate = 60_000, initialDelay = 10_000)
    public void runRealtimeTasks() {
        log.debug("[MasterScheduler] Bắt đầu chu kỳ tác vụ 60s");

        // 1. Tự động hủy đơn giữ chỗ tạm thời quá hạn (15 phút)
        try {
            bookingService.expireOverdueHoldings();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý expireOverdueHoldings:", e);
        }

        // 2. Tự động đánh dấu No-show cho đơn quá giờ hẹn
        try {
            bookingService.expireOverdueConfirmedBookings();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý expireOverdueConfirmedBookings:", e);
        }

        // 3. Tự động dọn dẹp các đơn Checked-in bị treo quá giờ
        try {
            bookingService.autoCheckoutStuckBookings();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý autoCheckoutStuckBookings:", e);
        }

        // 4. Tự động chuyển bàn CLEANING (Dọn dẹp) sang EMPTY (Trống) sau 15 phút
        try {
            diningTableService.autoReleaseCleaningTables();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý autoReleaseCleaningTables:", e);
        }

        // 5. Đồng bộ trạng thái lệnh hoàn tiền Payout từ payOS
        try {
            payoutOrderService.syncProcessingPayouts();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý syncProcessingPayouts:", e);
        }

        // 6. Gửi nhắc nhở lịch hẹn đặt bàn sắp tới (trước 15-30 phút)
        try {
            notificationService.sendBookingReminders();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý sendBookingReminders:", e);
        }

        // 7. Thử gửi lại các thông báo bị thất bại
        try {
            notificationService.retryFailedNotifications();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý retryFailedNotifications:", e);
        }
    }

    /**
     * Tác vụ Subscription / Gói dịch vụ: Chạy mỗi 5 phút (bắt đầu sau khi server
     * khởi động 30 giây).
     * Không cần chạy mỗi 30s vì hóa đơn gói dịch vụ tính theo chu kỳ ngày/tháng.
     */
    @Scheduled(fixedRate = 30_000, initialDelay = 30_000)
    public void runSubscriptionBillingTasks() {
        log.debug("[MasterScheduler] Bắt đầu chu kỳ tác vụ Subscription");

        // 1. Phát hành hóa đơn gia hạn gói dịch vụ sắp hết hạn
        try {
            subscriptionBillingScheduler.generateRenewalInvoices();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý generateRenewalInvoices:", e);
        }

        // 2. Chuyển hóa đơn quá hạn sang OVERDUE & kích hoạt thời gian ân hạn
        try {
            subscriptionBillingScheduler.markOverdueAndStartGracePeriod();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý markOverdueAndStartGracePeriod:", e);
        }

        // 3. Tạm ngưng chi nhánh vượt hạn mức khi hết thời gian ân hạn
        try {
            subscriptionBillingScheduler.expireAndSuspendOverLimitBranches();
        } catch (Exception e) {
            log.error("[MasterScheduler] Lỗi khi xử lý expireAndSuspendOverLimitBranches:", e);
        }
    }
}
