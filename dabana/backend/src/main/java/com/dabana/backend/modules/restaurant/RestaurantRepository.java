//package com.dabana.backend.modules.restaurant;
//
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.jpa.repository.JpaRepository;
//
//import com.dabana.backend.modules.restaurant.entity.Restaurant;
//
//import java.util.List;
//import java.util.Optional;
//
//
//public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
//
//    List<Restaurant> findByApprovalStatus(ApprovalStatus pending);
//
//    Page<Restaurant> findByApprovalStatus(ApprovalStatus status, Pageable pageable);
//
//    Page<Restaurant> searchByKeyword(String blankToNull, Pageable pageable);
//
//    Restaurant countByApprovalStatus(ApprovalStatus pending);
//
//}
