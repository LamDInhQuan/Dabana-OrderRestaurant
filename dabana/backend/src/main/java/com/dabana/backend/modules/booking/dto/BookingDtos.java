package com.dabana.backend.modules.booking.dto;

import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class BookingDtos {

    /** B01 Buoc 3-7: tao yeu cau giu ban tam thoi */
    @Data
    public static class CreateHoldRequest {
        @NotNull
        private Long branchId;
        @NotEmpty
        private List<Long> tableIds;
        @NotNull
        @Min(1)
        private Integer guestCount;

        @NotNull
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime reservationTime;
        private String contactName;
        private String contactPhone;
        private String contactEmail ;
        private String note;
        private List<PreOrderItemRequest> items;
        private String otpCode;
    }


    /** B01 Buoc 5: dat mon truoc (tuy chon - AF02 neu bo qua) */
    @Data
    public static class PreOrderItemRequest {
        @NotNull
        private Long menuItemId;
        @NotNull
        @Min(1)
        private Integer quantity;
    }

    @Data
    public static class PreOrderRequest {
        private List<PreOrderItemRequest> items;
    }

    /** B01 Buoc 8: ket qua thanh toan tu cong thanh toan (callback/webhook) */
    @Data
    public static class PaymentResultRequest {
        @NotBlank
        private String transactionId;
        @NotBlank
        private String status; // SUCCESS / FAILED
    }

    @Data
    @Builder
    public static class BookingResponse {
        private Long id;
        private String restaurantName;
        private String branchName;
        private BookingStatus status;
        private Byte guestCount;
        private LocalDateTime reservationTime;
        private List<DiningTableResponse> tables;
        private String name;
        private String phone;
        private String note;
        private List<BookingItemResponse> items;
        private BigDecimal estimatedTotal;
        private BigDecimal totalPreOrderAmount;
        private String policyName;
        private LocalDateTime holdExpiresAt;
        private Long remainSeconds;
        private Boolean paymentAvailable;
        private Boolean editable;
    }

    @Data
    @Builder
    public static class BookingItemResponse {
        private String name;
        private BigDecimal price;
        private Integer quantity;
    }

    /** B11: yeu cau huy don */
    @Data
    public static class CancelRequest {
        private String reason;
        private Boolean cancelledByRestaurant = false; // B11 buoc 4 vs buoc 3
    }
}
