package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByProvinceAndStatus(String province, Integer status);

    List<Branch> findByRestaurantId(Long restaurantId);

    List<Branch> findByRestaurantIdAndStatus(Long restaurantId, Integer status);

    Long countByRestaurantIdAndStatus(Long restaurantId, Integer status);

    boolean existsByPhone(String phone);

    // List<Branch> findByApprovalStatus(ApprovalStatus status);
    //
    // Page<Branch> findByApprovalStatus(ApprovalStatus status, Pageable pageable);
    //
    // long countByApprovalStatus(ApprovalStatus status);

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

    Long countByStatus(Integer pending);

    List<Branch> findByStatus(Integer pending);

    List<Branch> findByProvince(String province);

    @Query("""
        SELECT DISTINCT b.province FROM Branch b
        JOIN b.restaurant r
        WHERE b.status = 2 
          AND r.approvalStatus != com.dabana.backend.modules.restaurant.ApprovalStatus.PENDING
          AND r.approvalStatus != com.dabana.backend.modules.restaurant.ApprovalStatus.REJECTED
          AND b.province IS NOT NULL AND b.province != ''
    """)
    List<String> findAllActiveProvinceNames();

    @Query("""
        SELECT DISTINCT b.restaurant FROM Branch b
        JOIN b.restaurant r
        WHERE b.status = 2 
          AND r.approvalStatus != com.dabana.backend.modules.restaurant.ApprovalStatus.PENDING
          AND r.approvalStatus != com.dabana.backend.modules.restaurant.ApprovalStatus.REJECTED
          AND (:cuisine IS NULL OR :cuisine = '' OR r.cuisineType LIKE CONCAT('%', :cuisine, '%'))
          And (:province IS NULL OR :province = '' OR b.province = :province)
          AND (:keyword IS NULL OR :keyword = '' OR LOWER(r.restaurantName) LIKE LOWER(CONCAT('%', :keyword, '%')) 
               OR LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    List<Restaurant> searchRestaurantsByBranchFilter(
            @Param("keyword") String keyword,
            @Param("province") String province,
            @Param("cuisine") String cuisine
    );

    @Query("SELECT b FROM Branch b WHERE b.restaurant.id IN :restaurantIds AND b.status = :status")
    List<Branch> findByRestaurantIdInAndStatus(@Param("restaurantIds") List<Long> restaurantIds, @Param("status") Integer status);
}
