package com.dabana.backend.modules.orderboard.dto.response;

import com.dabana.backend.modules.booking.BookingStatus;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Thong tin rut gon cua Booking dang "active" (CONFIRMED / CHECKED_IN) gan
 * voi 1 ban, dung cho the ban tren Tab Goi Mon. Khong tra ve toan bo
 * BookingResponse day du de tranh nang payload khi load ca so do ban.
 */
@Data
public class ActiveBookingResponse {
    private Long bookingId;
    private BookingStatus status;
    private String contactName;
    private String contactPhone;
    private LocalDateTime reservationTime;
    private Integer guestCount;
}
