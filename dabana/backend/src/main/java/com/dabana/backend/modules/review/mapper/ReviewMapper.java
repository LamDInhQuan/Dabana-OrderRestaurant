package com.dabana.backend.modules.review.mapper;

import com.dabana.backend.modules.review.Review;
import com.dabana.backend.modules.review.dto.response.ReviewResponse;
import org.springframework.stereotype.Component;

@Component
public class ReviewMapper {

    public ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .branchId(review.getBranch().getId())
                .branchName(review.getBranch().getName())
                .spaceRating(review.getSpaceRating())
                .serviceRating(review.getServiceRating())
                .foodRating(review.getFoodRating())
                .comment(review.getComment())
                .hidden(review.getHidden())
                .restaurantReply(review.getRestaurantReply())
                .createdAt(review.getCreatedAt())
                .customer(ReviewResponse.CustomerInfo.builder()
                        .id(review.getCustomer().getId())
                        .fullName(review.getCustomer().getFullName())
                        .build())
                .build();
    }
}
