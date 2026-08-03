package com.dabana.backend.modules.restaurant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dabana.backend.modules.restaurant.entity.RestaurantLicense;

@Repository
public interface RestaurantLicenseRepository extends JpaRepository<RestaurantLicense, Long> {
    List<RestaurantLicense> findByRestaurantId(Long restaurantId);
}
