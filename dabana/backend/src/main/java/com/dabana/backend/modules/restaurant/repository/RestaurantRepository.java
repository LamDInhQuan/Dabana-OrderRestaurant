package com.dabana.backend.modules.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.dabana.backend.modules.restaurant.entity.Restaurant;

import java.util.Optional;


public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
   Optional<Restaurant> findByOwnerId(Long ownerId);

   Optional<Restaurant> findByBrandName(String name);

   void deleteById(Long id);

   Optional<Restaurant> findById(Long id);


}
