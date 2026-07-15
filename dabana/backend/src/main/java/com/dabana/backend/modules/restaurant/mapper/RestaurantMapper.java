package com.dabana.backend.modules.restaurant.mapper;

import org.springframework.stereotype.Component;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.OwnerDto;
import com.dabana.backend.modules.restaurant.Dto.RestaurantResponse;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRequest;
import com.dabana.backend.modules.restaurant.entity.Restaurant;

@Component
public class RestaurantMapper {
    public Restaurant toEntity(RestaurantRequest request) {
        Restaurant restaurant = new Restaurant();

        restaurant.setBrandName(request.getBrandName());
        restaurant.setLogoUrl(request.getLogoUrl());
        restaurant.setDescription(request.getDescription());
        restaurant.setCuisineType(request.getCuisineType());
        restaurant.setStatus(restaurant.getStatus());
        return restaurant;
    }
    public RestaurantResponse toResponse(Restaurant restaurant) {
        RestaurantResponse response = new RestaurantResponse();
        User user = restaurant.getOwner();

        OwnerDto ownerdto = new OwnerDto();
        ownerdto.setId(user.getId());
        ownerdto.setEmail(user.getEmail());
        ownerdto.setPhone(user.getPhone());
        ownerdto.setAvatarUrl(user.getAvatarUrl());
        ownerdto.setFullName(user.getFullName());

        response.setOwner(ownerdto);
        response.setBrandName(restaurant.getBrandName());
        response.setLogoUrl(restaurant.getLogoUrl());
        response.setDescription(restaurant.getDescription());
        response.setCuisineType(restaurant.getCuisineType());
       
        return response;    
    }
}
