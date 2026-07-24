package com.dabana.backend.modules.review.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * B13: du lieu tra ve cho 1 danh gia - dung chung cho ca man hinh cong khai
 * (chi tiet chi nhanh) va man hinh Partner Portal (nha hang xem danh gia
 * cua chi nhanh minh).
 */
@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long bookingId;
    private Long branchId;
    private String branchName;
    private Integer spaceRating;
    private Integer serviceRating;
    private Integer foodRating;
    private String comment;
    private Boolean hidden;
    private LocalDateTime createdAt;
    private CustomerInfo customer;

    @Data
    @Builder
    public static class CustomerInfo {
        private Long id;
        private String fullName;
    }
}
