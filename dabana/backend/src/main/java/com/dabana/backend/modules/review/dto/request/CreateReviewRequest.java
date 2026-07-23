package com.dabana.backend.modules.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * B13 Buoc 2: khach gui danh gia cho 1 don dat ban da hoan tat (COMPLETED).
 */
@Data
public class CreateReviewRequest {

    @NotNull
    private Long bookingId;

    @NotNull
    @Min(1) @Max(5)
    private Integer spaceRating;

    @NotNull
    @Min(1) @Max(5)
    private Integer serviceRating;

    @NotNull
    @Min(1) @Max(5)
    private Integer foodRating;

    private String comment;
}
