package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByRestaurantId(Long restaurantId);

    boolean existsByPhone(String phone);


//    List<Branch> findByApprovalStatus(ApprovalStatus status);
//
//    Page<Branch> findByApprovalStatus(ApprovalStatus status, Pageable pageable);
//
//    long countByApprovalStatus(ApprovalStatus status);

    /**
     * B01 Buoc 1: tim kiem da tieu chi tren toan nen tang - chi tra ve
     * cac chi nhanh da duyet va dang hoat dong (BR02 cua B04).
     */
    @Query("""
        SELECT b FROM Branch b
        WHERE (:keyword IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(b.address) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Branch> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    List<Branch> findByRestaurant_Owner_Id(Long ownerId);
}
