package com.dabana.backend.modules.restaurant.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.admin.util.AdminErrorCode;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.restaurant.service.RestaurantService;
import com.dabana.backend.modules.zone.dto.response.ZoneResponse;
import com.dabana.backend.modules.zone.service.IZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
public class RestaurantPublicController {

    private final RestaurantService restaurantService;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantMapper restaurantMapper;

    @GetMapping("all")
    public ResponseEntity<ApiResponse<List<RestaurantResponse>>> getAllRestaurant() {
        return ResponseEntity.ok(
                ResponseBuilder.success(SuccessCode.SUCCESS, restaurantService.findAll()));

    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<RestaurantResponse> getRestaurantByUserId(@PathVariable Long userId) {
        Restaurant restaurant = restaurantRepository.findByOwnerUserId(userId)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.RESTAURANT_NOT_FOUND));

        return ResponseEntity.ok(restaurantMapper.toResponse(restaurant));
    }
}