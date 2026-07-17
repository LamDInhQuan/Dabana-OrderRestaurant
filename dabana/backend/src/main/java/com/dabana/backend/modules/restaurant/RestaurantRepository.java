package com.dabana.backend.modules.restaurant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findAllByOwnerId(Long ownerId);

    Optional<Restaurant> findByBrandName(String brandName);

    List<Restaurant> findByStatus(ApprovalStatus status);

    Page<Restaurant> findByStatus(ApprovalStatus status, Pageable pageable);

    long countByStatus(ApprovalStatus status);

    @Query("""
        SELECT r FROM Restaurant r
        WHERE (:keyword IS NULL OR LOWER(r.brandName) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(r.cuisineType) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Restaurant> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
