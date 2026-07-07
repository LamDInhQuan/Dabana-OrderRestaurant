package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchRepository extends JpaRepository<com.dabana.backend.modules.branch2.entity.Branch, Long> {

    List<com.dabana.backend.modules.branch2.entity.Branch> findByRestaurantId(Long restaurantId);

    /**
     * B01 Buoc 1: tim kiem da tieu chi tren toan nen tang - chi tra ve
     * cac chi nhanh da duyet va dang hoat dong (BR02 cua B04).
     */
//    @Query("""
//        SELECT b FROM Branch b
//        WHERE b.approvalStatus = :approvalStatus
//        AND b.operatingStatus = :operatingStatus
//        AND (:keyword IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
//             OR LOWER(b.address) LIKE LOWER(CONCAT('%', :keyword, '%')))
//        AND (:cuisineType IS NULL OR b.restaurant.cuisineType = :cuisineType)
//        """)
//    Page<com.dabana.backend.modules.branch2.entity.Branch> searchBranches(
//            @Param("approvalStatus") ApprovalStatus approvalStatus,
//            @Param("operatingStatus") BranchOperatingStatus operatingStatus,
//            @Param("keyword") String keyword,
//            @Param("cuisineType") String cuisineType,
//            Pageable pageable);

//    List<com.dabana.backend.modules.branch2.entity.Branch> findByApprovalStatus(ApprovalStatus status);
}
