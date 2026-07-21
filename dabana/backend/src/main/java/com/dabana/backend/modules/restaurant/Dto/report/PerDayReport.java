package com.dabana.backend.modules.restaurant.Dto.report;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.dabana.backend.modules.booking.dto.BookingDtos.BookingResponse;

import lombok.Builder;
import lombok.Data;

/**
 * báo cáo theo ngày
 */
@Data
@Builder
public class PerDayReport {

    
    private int TodayBooking;
    private int TodayServing;
    private int TodayBooked;
    private int TodayWait;
    private LocalDateTime ReportedDate;
    
    private List<BookingResponse> bookingDtos;

    
}
