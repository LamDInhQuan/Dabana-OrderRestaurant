package com.dabana.backend.modules.restaurant;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.dabana.backend.modules.restaurant.request.RestaurantUpdateRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RestaurantService  {
    private final RestaurantRepository restaurantRepos;

    public List<Restaurant> findByOwnerId(Long ownerId) {
        return Optional.ofNullable(restaurantRepos.findAllByOwnerId(ownerId)).
        orElseThrow(() -> new RuntimeException("Restaurant not found for ownerId: " + ownerId));
    }

    public Restaurant findByName(String name) {
        return restaurantRepos.findByName(name).
        orElseThrow(() -> new RuntimeException("Restaurant not found for name: " + name));
    }

    public void deleteById(Long id) {
        restaurantRepos.deleteById(id);
    }

    public Restaurant findById(Long id) {
        return restaurantRepos.findById(id).
        orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));
    }

    public Restaurant updateRestaurantById(Long id, RestaurantUpdateRequest request) {
        Restaurant restaurant = restaurantRepos.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));
        

        restaurant.setBrandName(request.getBrandName());
        restaurant.setLogoUrl(request.getLogoUrl());
        restaurant.setDescription(request.getDescription());
        restaurant.setCuisineType(request.getCuisineType());

        return restaurantRepos.save(restaurant);
    }
}
