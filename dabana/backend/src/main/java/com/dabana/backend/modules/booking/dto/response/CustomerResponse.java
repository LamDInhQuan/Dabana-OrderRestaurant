package com.dabana.backend.modules.booking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomerResponse {
    private Long customerId;       // Sẽ là null nếu là khách vãng lai
    private String fullName;
    private String phone;
    private String email;          // Thêm email để làm mốc định danh
    private Long totalBookings;
    private Long completedBookings;
    private Long cancelledOrNoShow;
    private BigDecimal totalDeposit;
    private LocalDateTime lastVisit;
}