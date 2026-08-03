package com.dabana.backend.modules.restaurant.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.dabana.backend.modules.restaurant.Dto.RestaurantLicensesDto;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantAndLicenseResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.entity.RestaurantLicense;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import com.dabana.backend.modules.restaurant.repository.RestaurantLicenseRepository;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.restaurant.ApprovalStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RestaurantLicenseService {
    private final RestaurantLicenseRepository restaurantLicenseRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantMapper restaurantMapper;  

    public RestaurantLicense downloadLicense(Long licenseId) {
        return restaurantLicenseRepository.findById(licenseId)
                .orElseThrow(() -> new RuntimeException("License not found for licenseId: " + licenseId));
    }

    public List<RestaurantAndLicenseResponse> getAllRestaurantAndLicense() {
        List<Restaurant> restaurants = restaurantRepository.findAll();
        List<RestaurantAndLicenseResponse> responses = new ArrayList<>();

        for (Restaurant restaurant : restaurants) {
            List<RestaurantLicense> license = restaurantLicenseRepository.findByRestaurantId(restaurant.getId());
            responses.add(RestaurantAndLicenseResponse.builder()
                    .restaurant(restaurantMapper.toResponse(restaurant))
                    .licenses(license.stream().map(restaurantMapper::toRestaurantLicensesDto).toList())
                    .build());
        }
        return responses;
    }

    public List<RestaurantAndLicenseResponse> getPendingRestaurantsAndLicenses() {
        List<Restaurant> pending = new ArrayList<>(restaurantRepository.findByApprovalStatus(ApprovalStatus.PENDING));
        pending.addAll(restaurantRepository.findByApprovalStatus(ApprovalStatus.PENDING_UPDATE));

        List<RestaurantAndLicenseResponse> responses = new ArrayList<>();
        for (Restaurant restaurant : pending) {
            List<RestaurantLicense> license = restaurantLicenseRepository.findByRestaurantId(restaurant.getId());
            responses.add(RestaurantAndLicenseResponse.builder()
                    .restaurant(restaurantMapper.toResponse(restaurant))
                    .licenses(license.stream().map(restaurantMapper::toRestaurantLicensesDto).toList())
                    .build());
        }
        return responses;
    }

    public RestaurantAndLicenseResponse getAllLicenseByRestaurantId(Long restaurantid) {
        Restaurant restaurant = restaurantRepository.findById(restaurantid)
                .orElseThrow(() -> new RuntimeException("Restaurant not found for restaurantId: " + restaurantid));
        List<RestaurantLicense> licenses = restaurantLicenseRepository.findByRestaurantId(restaurantid);
        
        if(licenses.isEmpty()) {
            throw new RuntimeException("License not found for restaurantId: " + restaurantid);
        }

        return RestaurantAndLicenseResponse.builder()
                .restaurant(restaurantMapper.toResponse(restaurant))
                .licenses(licenses.stream().map(restaurantMapper::toRestaurantLicensesDto).toList())
                .build();
    }
}
