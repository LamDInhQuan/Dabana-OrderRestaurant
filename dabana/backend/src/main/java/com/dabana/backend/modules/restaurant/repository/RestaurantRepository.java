package com.dabana.backend.modules.restaurant.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.entity.Restaurant;

import java.util.List;
import java.util.Optional;


public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
   @Query("select r from Restaurant r where r.owner.id = :ownerId ")
   Optional<Restaurant> findByOwnerUserId(@Param("ownerId") Long ownerId);

   // Tìm nhà hàng theo đúng tên thuộc tính restaurantName
   Optional<Restaurant> findByRestaurantName(String restaurantName);

   Long countByApprovalStatus(ApprovalStatus pending);

   List<Restaurant> findByApprovalStatus(ApprovalStatus pending);

   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("select r from Restaurant r where r.id = :id")
   Optional<Restaurant> findByIdForUpdate(@Param("id") Long id);

   @Query("""
       SELECT DISTINCT r FROM Restaurant r
       WHERE r.approvalStatus != com.dabana.backend.modules.restaurant.ApprovalStatus.PENDING
         AND r.approvalStatus != com.dabana.backend.modules.restaurant.ApprovalStatus.REJECTED
         AND EXISTS (
             SELECT 1 FROM Branch b
             WHERE b.restaurant.id = r.id AND b.status = :branchStatus
         )
   """)
   List<Restaurant> findRestaurantsWithActiveBranches(@Param("branchStatus") Integer branchStatus);
}
