package com.dabana.backend.modules.review;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.BaseController;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.review.dto.request.CreateReviewRequest;
import com.dabana.backend.modules.review.dto.request.ReplyReviewRequest;
import com.dabana.backend.modules.review.dto.response.ReviewResponse;
import com.dabana.backend.modules.review.service.IReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * /api/reviews - B13: thu thap danh gia sau khi don hoan tat (COMPLETED),
 * cap nhat diem xep hang chi nhanh.
 * - POST /api/reviews: khach hang gui danh gia (chi don COMPLETED - BR01).
 * - GET /api/reviews/branch/{branchId}: xem danh gia cong khai cua 1 chi nhanh,
 *   dung chung cho trang chi tiet chi nhanh (khach) va tab Danh gia ben
 *   Partner Portal (nha hang xem danh gia cua chinh chi nhanh minh).
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController extends BaseController {

    private final IReviewService reviewService;

    /** B13 Buoc 2: khach gui danh gia cho don dat ban da hoan tat. */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(@Valid @RequestBody CreateReviewRequest request) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED,
                reviewService.createReview(request, currentUser)));
    }

    /** Lay danh gia theo chi nhanh (trang chi tiet chi nhanh - B01, va tab Danh gia cua nha hang - B13). */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviewsByBranch(
            @PathVariable Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reviewService.getByBranch(branchId, pageable)));
    }

    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<ApiResponse<ReviewResponse>> replyReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReplyReviewRequest request) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                reviewService.replyReview(reviewId, request, currentUser)));
    }
}
