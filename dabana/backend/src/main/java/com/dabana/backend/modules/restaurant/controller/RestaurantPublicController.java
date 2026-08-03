package com.dabana.backend.modules.restaurant.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.admin.util.AdminErrorCode;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.restaurant.Dto.request.SystemOptionsResponse;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantDetailResponse;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.entity.RestaurantLicense;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.restaurant.service.RestaurantService;
import com.dabana.backend.modules.zone.dto.response.ZoneResponse;
import com.dabana.backend.modules.zone.service.IZoneService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/search")
    public ResponseEntity<List<RestaurantDetailResponse>> searchRestaurants(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String cuisine) {

        // Gọi thẳng sang BranchRepository thay vì RestaurantRepository
        List<RestaurantDetailResponse> results = restaurantService.searchRestaurantsWithBranches(keyword, province, cuisine);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<RestaurantResponse> getRestaurantByUserId(@PathVariable Long userId) {
        Restaurant restaurant = restaurantRepository.findByOwnerUserId(userId)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.RESTAURANT_NOT_FOUND));

        return ResponseEntity.ok(restaurantMapper.toResponse(restaurant));
    }

    @GetMapping("/options")
    public ResponseEntity<ApiResponse<SystemOptionsResponse>> getOptions() {
        return ResponseEntity.ok(
                ResponseBuilder.success(SuccessCode.SUCCESS, restaurantService.getAllOptions()));
    }
}