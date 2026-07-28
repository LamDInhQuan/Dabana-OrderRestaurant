package com.dabana.backend.modules.review.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReplyReviewRequest {

    @NotBlank(message = "Nội dung phản hồi không được để trống")
    private String reply; // Hoặc bạn có thể đặt tên là comment tùy theo ý muốn
}