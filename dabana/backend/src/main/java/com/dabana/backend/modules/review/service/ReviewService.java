package com.dabana.backend.modules.review.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.review.Review;
import com.dabana.backend.modules.review.ReviewRepository;
import com.dabana.backend.modules.review.dto.request.CreateReviewRequest;
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

        // BR01: chi hoa don (don dat ban) da hoan tat (COMPLETED) moi duoc danh gia
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BusinessException(ReviewErrorCode.BOOKING_NOT_COMPLETED);
        }

        // Chi chinh chu don moi duoc danh gia
        if (!booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new BusinessException(ReviewErrorCode.FORBIDDEN);
        }

        // Moi don chi duoc danh gia 1 lan (rang buoc unique booking_id o tang DB cung
        // da bao ve dieu nay, kiem tra som o day de tra loi loi ro rang hon cho FE).
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

        review = reviewRepository.save(review);
        return reviewMapper.toResponse(review);
    }

    @Override
    public Page<ReviewResponse> getByBranch(Long branchId, Pageable pageable) {
        return reviewRepository.findByBranchIdAndHiddenFalse(branchId, pageable)
                .map(reviewMapper::toResponse);
    }
}
