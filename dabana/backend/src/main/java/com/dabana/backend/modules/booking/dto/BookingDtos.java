package com.dabana.backend.modules.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class BookingDtos {

    @Data
    public static class ReservationHoldRequest {
        @JsonProperty("branch_id")
        @NotNull
        private Long branchId;

        @JsonProperty("reservation_time")
        @NotNull
        private LocalDateTime reservationTime;

        @JsonProperty("guest_count")
        @NotNull
        @Min(1)
        private Integer guestCount;

        @JsonProperty("table_ids")
        @NotEmpty
        private List<Long> tableIds;
    }

    @Data
    public static class PreOrderItemRequest {
        @JsonProperty("menu_item_id")
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

    @Data
    @Builder
    public static class ReservationHoldResponse {
        @JsonProperty("reservation_id")
        private Long reservationId;

        @JsonProperty("hold_expires_at")
        private LocalDateTime holdExpiresAt;
    }

    @Data
    @Builder
    public static class ReservationDetailResponse {
        @JsonProperty("reservation_id")
        private Long reservationId;

        private String status;

        @JsonProperty("estimated_total")
        private BigDecimal estimatedTotal;

        private List<BookingItemResponse> items;
    }

    @Data
    @Builder
    public static class ReservationConfirmResponse {
        @JsonProperty("reservation_id")
        private Long reservationId;

        private String status;
    }

    @Data
    @Builder
    public static class BookingItemResponse {
        private String name;
        private BigDecimal price;
        private Integer quantity;
    }
}
