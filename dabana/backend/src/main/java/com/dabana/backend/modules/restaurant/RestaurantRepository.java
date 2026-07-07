//package com.dabana.backend.modules.restaurant;
//
//import org.springframework.data.jpa.repository.JpaRepository;
//
//
//import java.util.List;
//import java.util.Optional;
//
//
//public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
//    List<Restaurant> findAllByOwnerId(Long ownerId);
//
//    Optional<Restaurant> findByName(String name);
//
//    void deleteById(Long id);
//
//    Optional<Restaurant> findById(Long id);
//
//    Optional<Restaurant> updateRestaurantById(Long id, Restaurant restaurant);
//
//}
