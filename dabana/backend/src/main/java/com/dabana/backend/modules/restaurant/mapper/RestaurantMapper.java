package com.dabana.backend.modules.restaurant.mapper;

import org.springframework.stereotype.Component;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.OwnerDto;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantUpdateRequest;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;

@Component
public class RestaurantMapper {

    public Restaurant toEntity(RestaurantRegisterRequest request) {
        Restaurant restaurant = new Restaurant();

        restaurant.setRestaurantName(request.getRestaurantName());
        restaurant.setLogoUrl(request.getLogoUrl());
        restaurant.setDescription(request.getDescription());
        restaurant.setEmail(request.getEmail());
        restaurant.setPhone(request.getPhone());
        restaurant.setWebsite(request.getWebsite());
        return restaurant;
    }
    public Restaurant toEntity(RestaurantUpdateRequest request,Restaurant restaurant) {
       
        restaurant.setRestaurantName(request.getRestaurantName());
        restaurant.setPendingLogoUrl(request.getPendingLogoUrl());
        restaurant.setPendingDescription(request.getPendingDescription());
        restaurant.setEmail(request.getEmail());
        restaurant.setPhone(request.getPhone());
        restaurant.setWebsite(request.getWebsite());
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
        response.setRestaurantName(restaurant.getRestaurantName());
        response.setLogoUrl(restaurant.getLogoUrl());
        response.setDescription(restaurant.getDescription());
       
        return response;    
    }
}
