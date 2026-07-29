package com.dabana.backend.modules.payment.scheduler;

import com.dabana.backend.modules.payment.service.PayoutOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * payOS KHONG co webhook cho lenh chi (chi co webhook cho link thanh toan/Thu -
 * xem ghi chu chi tiet o PayoutOrderService#syncProcessingPayouts). De tu dong
 * cap nhat PayoutState/Booking.refundStatus ma khong can nhan vien tra cuu thu
 * cong, chay job nay dinh ky de poll GET /v1/payouts/{payoutId} cho cac lenh
 * chi con dang PROCESSING.
 *
 * Cung convention voi BookingScheduledTasks (module booking): 1 @Component,
 * moi method 1 tac vu dinh ky rieng.
 */
@Component
@RequiredArgsConstructor
public class PaymentScheduledTasks {

    private final PayoutOrderService payoutOrderService;

    @Scheduled(fixedRate = 60_000) // moi 60 giay - dieu chinh neu can nhanh/cham hon
    public void syncProcessingPayouts() {
        payoutOrderService.syncProcessingPayouts();
    }
}