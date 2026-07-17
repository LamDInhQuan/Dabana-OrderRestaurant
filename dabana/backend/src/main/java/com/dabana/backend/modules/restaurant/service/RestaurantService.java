package com.dabana.backend.modules.restaurant.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.OwnerDto;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantUpdateRequest;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RestaurantService  {
    private final RestaurantRepository restaurantRepos;
    private final UserRepository userRepository;
    private final RestaurantMapper mapper;

   public RestaurantResponse findByOwnerId(Long ownerId) {
       return mapper.toResponse( restaurantRepos.findByOwnerId(ownerId).
       orElseThrow(() -> new RuntimeException("Restaurant not found for ownerId: " + ownerId)));
   }

   public Restaurant findByRestaurantName(String name) {
       return restaurantRepos.findByResTaurantName(name).
       orElseThrow(() -> new RuntimeException("Restaurant not found for name: " + name));
   }

   public void deleteById(Long id) {
       restaurantRepos.deleteById(id);
   }

   public Restaurant findById(Long id) {
       return restaurantRepos.findById(id).
       orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));
   }

   public RestaurantResponse updateRestaurantById(Long id, RestaurantUpdateRequest request) {
        Restaurant restaurant = restaurantRepos.findByOwnerId(id)
        
                .orElseThrow(() -> new RuntimeException("Restaurant not found for id: " + id));

        restaurant = mapper.toEntity(request);
        restaurant.setApprovalStatus(ApprovalStatus.PENDING_UPDATE);

        return mapper.toResponse(restaurantRepos.save(restaurant));
   }

   public RestaurantResponse Register(RestaurantRegisterRequest request,Long ownerId) {
        Restaurant restaurant = new Restaurant();
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("cannot found owner for id: " + ownerId));
        if (restaurantRepos.findByOwnerId(ownerId) != null) {
            throw new RuntimeException("owner already registered");
        }
        restaurant = mapper.toEntity(request);
        restaurant.setOwner(user);
        
        restaurant.setApprovalStatus(ApprovalStatus.PENDING);

        return mapper.toResponse( restaurantRepos.save(restaurant));
    }

    
}
