package com.dabana.backend.modules.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.dabana.backend.modules.restaurant.entity.Restaurant;

import java.util.Optional;


public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
   @Query("select r from Restaurant r where r.owner.id = :ownerId ")
   Optional<Restaurant> findByOwnerUserId(@Param("ownerId") Long ownerId);

   // Tìm nhà hàng theo đúng tên thuộc tính restaurantName
   Optional<Restaurant> findByRestaurantName(String restaurantName);



}
