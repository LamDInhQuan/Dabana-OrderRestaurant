package com.dabana.backend.modules.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByBookingId(Long bookingId);

    Page<Review> findByBranchIdAndHiddenFalse(Long branchId, Pageable pageable);

    Page<Review> findByHidden(Boolean hidden, Pageable pageable);

    @Query("SELECT AVG((r.spaceRating + r.serviceRating + r.foodRating) / 3.0) FROM Review r WHERE r.branch.id = :branchId AND r.hidden = false")
    Double calculateAverageRating(@Param("branchId") Long branchId);

    long countByHidden(Boolean hidden);
}
