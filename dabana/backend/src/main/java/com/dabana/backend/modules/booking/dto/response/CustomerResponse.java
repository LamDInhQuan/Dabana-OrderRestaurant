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
    private BigDecimal totalDeposit;      // Tổng tiền cọc
    private BigDecimal totalInvoicePaid;  // Tiền thanh toán hoá đơn (đã trừ cọc)
    private LocalDateTime lastVisit;

    public CustomerResponse(Long customerId, String fullName, String phone, String email,
                            Long totalBookings, Long completedBookings, Long cancelledOrNoShow,
                            Double totalDeposit, Double totalInvoicePaid, LocalDateTime lastVisit) {
        this.customerId = customerId;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.totalBookings = totalBookings;
        this.completedBookings = completedBookings;
        this.cancelledOrNoShow = cancelledOrNoShow;
        this.totalDeposit = totalDeposit != null ? BigDecimal.valueOf(totalDeposit) : BigDecimal.ZERO;
        this.totalInvoicePaid = totalInvoicePaid != null ? BigDecimal.valueOf(totalInvoicePaid) : BigDecimal.ZERO;
        this.lastVisit = lastVisit;
    }
}