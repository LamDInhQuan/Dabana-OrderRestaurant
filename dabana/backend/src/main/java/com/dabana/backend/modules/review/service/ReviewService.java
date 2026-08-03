package com.dabana.backend.modules.review.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.review.Review;
import com.dabana.backend.modules.review.ReviewRepository;
import com.dabana.backend.modules.review.dto.request.CreateReviewRequest;
import com.dabana.backend.modules.review.dto.request.ReplyReviewRequest;
import com.dabana.backend.modules.review.dto.response.ReviewResponse;
import com.dabana.backend.modules.review.mapper.ReviewMapper;
import com.dabana.backend.modules.review.util.ReviewErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * B13: Danh gia va xep hang chi nhanh sau khi don hoan tat.
 * BR01: chi don o trang thai COMPLETED moi duoc danh gia, moi don chi danh gia 1 lan.
 */
@Service
@RequiredArgsConstructor
public class ReviewService implements IReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final ReviewMapper reviewMapper;

    @Override
    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, User currentUser) {
        if (currentUser == null) {
            throw new BusinessException(ReviewErrorCode.FORBIDDEN);
        }

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.BOOKING_NOT_FOUND));

        // BR01: chỉ hóa đơn (đơn đặt bàn) đã hoàn tất (COMPLETED) mới được đánh giá
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BusinessException(ReviewErrorCode.BOOKING_NOT_COMPLETED);
        }

        // Chỉ chính chủ đơn mới được đánh giá (không áp dụng cho khách vãng lai)
        if (booking.getCustomer() == null || !booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new BusinessException(ReviewErrorCode.FORBIDDEN);
        }

        // Mỗi đơn chỉ được đánh giá 1 lần (ràng buộc unique booking_id ở tầng DB cũng
        // đã bảo vệ điều này, kiểm tra sớm ở đây để trả lời lỗi rõ ràng hơn cho FE).
        if (reviewRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new BusinessException(ReviewErrorCode.ALREADY_REVIEWED);
        }

        Review review = new Review();
        review.setCustomer(currentUser);
        review.setBranch(booking.getBranch());
        review.setBooking(booking);
        review.setSpaceRating(request.getSpaceRating());
        review.setServiceRating(request.getServiceRating());
        review.setFoodRating(request.getFoodRating());
        review.setComment(request.getComment());
        review.setHidden(false);

        // 🔥 TÍNH ĐIỂM TRUNG BÌNH TỔNG QUAN (Làm tròn hoặc ép kiểu int) ĐỂ TRÁNH LỖI NOT NULL TRONG DB
        int calculatedRating = (request.getSpaceRating() + request.getServiceRating() + request.getFoodRating()) / 3;
        review.setRating(calculatedRating);

        review = reviewRepository.save(review);
        return reviewMapper.toResponse(review);
    }
    @Override
    public Page<ReviewResponse> getByBranch(Long branchId, Pageable pageable) {
        return reviewRepository.findByBranchIdAndHiddenFalse(branchId, pageable)
                .map(reviewMapper::toResponse);
    }
    @Override
    public ReviewResponse replyReview(Long reviewId, ReplyReviewRequest request, User currentUser) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));

        // Kiểm tra quyền: Đảm bảo user hiện tại là chủ nhà hàng hoặc nhân viên quản lý chi nhánh đó
        // (Tùy thuộc vào phân quyền hệ thống của bạn)

        review.setRestaurantReply(request.getReply());
        Review updatedReview = reviewRepository.save(review);

        return reviewMapper.toResponse(updatedReview);
    }

}
