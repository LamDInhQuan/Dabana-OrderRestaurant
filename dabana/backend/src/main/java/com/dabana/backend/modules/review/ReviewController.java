//package com.dabana.backend.modules.review;
//
//import com.dabana.backend.exception.BusinessException;
//import com.dabana.backend.modules.auth.entity.User;
//import com.dabana.backend.modules.booking.Booking;
//import com.dabana.backend.modules.booking.BookingRepository;
//import com.dabana.backend.modules.booking.BookingStatus;
//import com.dabana.backend.modules.branch.BranchRepository;
//import com.dabana.backend.modules.auth.repository.UserRepository;
//import com.dabana.backend.security.CurrentUserProvider;
//import jakarta.validation.Valid;
//import jakarta.validation.constraints.Max;
//import jakarta.validation.constraints.Min;
//import lombok.Data;
//import lombok.RequiredArgsConstructor;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Sort;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import org.springframework.http.ResponseEntity;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Optional;
//
//// ===== Repository =====
//interface ReviewRepository extends JpaRepository<Review, Long> {
//    Optional<Review> findByBookingId(Long bookingId);
//    Page<Review> findByBranchId(Long branchId, org.springframework.data.domain.Pageable pageable);
//
//    @Query("SELECT AVG((r.spaceRating + r.serviceRating + r.foodRating) / 3.0) FROM Review r WHERE r.branch.id = :branchId")
//    Double calculateAverageRating(@Param("branchId") Long branchId);
//}
//
///**
// * B13: Thu thap danh gia sau khi don hoan tat, cap nhat diem xep hang chi nhanh.
// * BR01: chi don COMPLETED moi duoc danh gia (kiem tra trong createReview).
// */
//@RestController
//@RequestMapping("/api/reviews")
//@RequiredArgsConstructor
//public class ReviewController {
//
//    private final ReviewRepository reviewRepository;
//    private final BookingRepository bookingRepository;
//    private final BranchRepository branchRepository;
//    private final UserRepository userRepository;
//    private final CurrentUserProvider currentUserProvider;
//
//    @Data
//    public static class CreateReviewRequest {
//        private Long bookingId;
//        @Min(1) @Max(5) private Integer spaceRating;
//        @Min(1) @Max(5) private Integer serviceRating;
//        @Min(1) @Max(5) private Integer foodRating;
//        private String comment;
//    }
//
//    /** B13 Buoc 2: khach gui danh gia */
//    @PostMapping
//    @Transactional
//    public ResponseEntity<Review> createReview(@Valid @RequestBody CreateReviewRequest req) {
//        Long customerId = currentUserProvider.getCurrentUserId();
//
//        Booking booking = bookingRepository.findById(req.getBookingId())
//                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Khong tim thay don dat ban"));
//
//        // BR01 cua B13: chi don COMPLETED moi duoc danh gia
//        if (booking.getStatus() != BookingStatus.COMPLETED) {
//            throw new BusinessException("BOOKING_NOT_COMPLETED",
//                    "Chi co the danh gia don da hoan tat (BR01)");
//        }
//        if (!booking.getCustomer().getId().equals(customerId)) {
//            throw new BusinessException("FORBIDDEN", "Khong co quyen danh gia don nay");
//        }
//        if (reviewRepository.findByBookingId(req.getBookingId()).isPresent()) {
//            throw new BusinessException("ALREADY_REVIEWED", "Don nay da duoc danh gia");
//        }
//
//        User customer = userRepository.findById(customerId).orElseThrow();
//
//        Review review = new Review();
//        review.setCustomer(customer);
//        review.setBranch(booking.getBranch());
//        review.setBooking(booking);
//        review.setSpaceRating(req.getSpaceRating());
//        review.setServiceRating(req.getServiceRating());
//        review.setFoodRating(req.getFoodRating());
//        review.setComment(req.getComment());
//        reviewRepository.save(review);
//
//        // B13 Buoc 3: cap nhat diem trung binh chi nhanh ngay lap tuc
//        // (trong trien khai day du: luu vao truong averageRating cua Branch)
//        Double newAvg = reviewRepository.calculateAverageRating(booking.getBranch().getId());
//        // branchService.updateAverageRating(booking.getBranch().getId(), newAvg);
//
//        return ResponseEntity.ok(review);
//    }
//
//    /** Lay danh gia theo chi nhanh (hien thi tren trang chi tiet chi nhanh - B01 buoc 2) */
//    @GetMapping("/branch/{branchId}")
//    public ResponseEntity<Page<Review>> getReviewsByBranch(
//            @PathVariable Long branchId,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size) {
//        return ResponseEntity.ok(reviewRepository.findByBranchId(
//                branchId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
//    }
//}
