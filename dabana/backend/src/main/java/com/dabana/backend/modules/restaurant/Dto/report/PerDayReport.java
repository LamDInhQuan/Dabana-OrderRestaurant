package com.dabana.backend.modules.restaurant.Dto.report;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.dabana.backend.modules.booking.dto.BookingDtos.BookingResponse;
import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Builder;
import lombok.Data;

/**
 * báo cáo theo ngày
 */
@Data
@Builder
public class PerDayReport {

    
    private Long dailyBooking;
    private Long dailyServing;
    private Long dailyBooked;
    private Long dailyWait;
    private LocalDate reportedDate;
    @JsonIgnore
    private List<BookingResponse> bookingDtos;

    
}
