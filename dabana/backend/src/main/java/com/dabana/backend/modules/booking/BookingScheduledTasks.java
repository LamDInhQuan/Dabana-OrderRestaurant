package com.dabana.backend.modules.booking;

import com.dabana.backend.modules.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Cac tac vu chay dinh ky lien quan toi B01:
 * - EF04: tu dong huy don het han giu ban tam thoi (moi 1 phut).
 *
 * Nhac lich (B09) va canh bao no-show (B11) duoc dat o cac scheduler
 * rieng trong module notification/waitlist de tach biet trach nhiem
 * theo dung BR05 cua B09 (B01 khong tu quyet dinh noi dung thong bao).
 */
@Component
@RequiredArgsConstructor
public class BookingScheduledTasks {

    private final BookingService bookingService;

    public void expireOverdueHoldings() {
        bookingService.expireOverdueHoldings();
    }

    // B11 buoc 5-7 (tu dong): CONFIRMED qua gio hen + khoang dem -> NO_SHOW.
    public void expireOverdueConfirmedBookings() {
        bookingService.expireOverdueConfirmedBookings();
    }

    // 👉 THÊM TASK NÀY ĐỂ TỰ ĐỘNG DỌN DẸP CÁC ĐƠN CHECKED_IN BỊ TREO QUÁ GIỜ
    public void autoCheckoutStuckBookings() {
        bookingService.autoCheckoutStuckBookings();
    }
}