package com.dabana.backend.modules.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dabana.backend.modules.restaurant.entity.Restaurant;

import java.util.Optional;


public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
   Optional<Restaurant> findByOwner_Id(Long ownerId);

   // Tìm nhà hàng theo đúng tên thuộc tính restaurantName
   Optional<Restaurant> findByRestaurantName(String restaurantName);

}
