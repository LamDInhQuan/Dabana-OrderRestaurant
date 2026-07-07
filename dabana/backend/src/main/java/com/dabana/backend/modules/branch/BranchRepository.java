package com.dabana.backend.modules.branch;

import com.dabana.backend.modules.restaurant.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByRestaurantId(Integer restaurantId);

    /**
     * Tim kiem chi nhanh theo ten/dia chi/trang thai.
     * Repository nay phai khop voi Branch entity hien tai,
     * vi Branch khong con map approvalStatus/operatingStatus/restaurant relation.
     */
    @Query("""
        SELECT b FROM Branch b
        WHERE (:keyword IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(b.address) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(b.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:status IS NULL OR b.status = :status)
        """)
    Page<Branch> searchBranches(
            @Param("keyword") String keyword,
            @Param("status") Integer status,
            Pageable pageable);
}
