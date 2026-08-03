package com.dabana.backend.modules.branch2.mapper;

import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch2.dto.BranchImageDto;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchAvailabilityResponse;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchImage;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantDetailResponse;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Component
public class BranchMapper {

    public com.dabana.backend.modules.branch2.entity.Branch toEntity(BranchRequest request) {
        if (request == null) return null;
        com.dabana.backend.modules.branch2.entity.Branch branch = new com.dabana.backend.modules.branch2.entity.Branch();
        branch.setName(request.getName());
        branch.setProvince(request.getProvince());
        branch.setPhone(request.getPhone());
        branch.setAddress(request.getAddress());
        branch.setLatitude(request.getLatitude());
        branch.setLongitude(request.getLongitude());
        return branch;
    }

    public BranchResponse toResponse(com.dabana.backend.modules.branch2.entity.Branch branch) {
        if (branch == null) return null ;
        BranchResponse response = new BranchResponse();
        response.setId(branch.getId());
        response.setRestaurantId(branch.getRestaurant().getId().intValue());
        response.setName(branch.getName());
        response.setProvince(branch.getProvince());
        response.setAddress(branch.getAddress());
        response.setPhone(branch.getPhone());
        response.setLatitude(branch.getLatitude());
        response.setLongitude(branch.getLongitude());
        response.setStatus(branch.getStatus());
        response.setCreatedAt(branch.getCreatedAt());
        response.setUpdatedAt(branch.getUpdatedAt());
        if (branch.getImages() != null) {
            response.setBranchImageDtos(
                    branch.getImages().stream().map(img -> {
                        BranchImageDto dto = new BranchImageDto();
                        dto.setId(img.getId());
                        dto.setImageUrl(img.getImageUrl());
                        dto.setIsCover(img.getIsCover());
                        dto.setDisplayOrder(img.getDisplayOrder());
                        return dto;
                    }).collect(Collectors.toList())
            );
        } else {
            response.setBranchImageDtos(new ArrayList<>());
        }
        return response;
    }

    public BranchAvailabilityResponse toAvailabilityResponse(com.dabana.backend.modules.branch2.entity.Branch branch) {
        if (branch == null) return null ;
        BranchAvailabilityResponse response = new BranchAvailabilityResponse();
        response.setId(branch.getId());
        response.setRestaurantId(branch.getRestaurant().getId().intValue());
        response.setName(branch.getName());
        response.setProvince(branch.getProvince());
        response.setAddress(branch.getAddress());
        response.setPhone(branch.getPhone());
        response.setLatitude(branch.getLatitude());
        response.setLongitude(branch.getLongitude());
        response.setStatus(branch.getStatus());
        response.setCreatedAt(branch.getCreatedAt());
        response.setUpdatedAt(branch.getUpdatedAt());
        return response;
    }


}
