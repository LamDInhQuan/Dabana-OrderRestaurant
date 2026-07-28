package com.dabana.backend.modules.review.service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.review.dto.request.CreateReviewRequest;
import com.dabana.backend.modules.review.dto.request.ReplyReviewRequest;
import com.dabana.backend.modules.review.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IReviewService {

    /**
     * B13 Buoc 2-3: khach gui danh gia cho don COMPLETED cua chinh minh, moi don
     * chi duoc danh gia 1 lan (BR01).
     */
    ReviewResponse createReview(CreateReviewRequest request, User currentUser);

    /**
     * Danh gia cong khai cua 1 chi nhanh (khong hien danh gia bi an) - dung cho
     * trang chi tiet chi nhanh (khach) va tab Danh gia ben Partner Portal
     * (nha hang xem danh gia chi nhanh minh).
     */
    Page<ReviewResponse> getByBranch(Long branchId, Pageable pageable);

    ReviewResponse replyReview(Long reviewId, ReplyReviewRequest request, User currentUser) ;
}
