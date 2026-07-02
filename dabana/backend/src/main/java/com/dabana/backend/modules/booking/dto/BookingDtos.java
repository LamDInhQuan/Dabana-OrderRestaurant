package com.dabana.backend.modules.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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

        @NotNull
        private Long tableId; // null neu dung AF01 "goi y ban"

        @NotNull
        @Min(1)
        private Integer guestCount;

        @NotNull
        private LocalDateTime reservationTime;

        private Boolean useAutoSuggest = false; // AF01
    }

    /** B01 Buoc 4: nhap thong tin lien he */
    @Data
    public static class ContactInfoRequest {
        @NotBlank
        private String contactName;
        @NotBlank
        private String contactPhone;
        private String note;
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
        private String branchName;
        private String tableCode;
        private Integer guestCount;
        private LocalDateTime reservationTime;
        private LocalDateTime holdExpiresAt;
        private String status;
        private BigDecimal depositAmount;
        private BigDecimal totalPreOrderAmount;
        private List<BookingItemResponse> items;
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
