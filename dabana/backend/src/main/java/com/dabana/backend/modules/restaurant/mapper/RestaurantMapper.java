package com.dabana.backend.modules.restaurant.mapper;

import com.dabana.backend.modules.branch2.dto.BranchImageDto;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchImage;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantDetailResponse;
import org.springframework.stereotype.Component;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.OwnerDto;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantUpdateRequest;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;

import java.util.List;
import java.util.Map;

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
        restaurant.setLogoUrl(request.getLogoUrl());
        restaurant.setDescription(request.getDescription());
        restaurant.setEmail(request.getEmail());
        restaurant.setPhone(request.getPhone());
        restaurant.setWebsite(request.getWebsite());
        restaurant.setCuisineType(request.getCuisineType());
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

        response.setId(restaurant.getId());
        response.setApprovalStatus(restaurant.getApprovalStatus());
        response.setOwner(ownerdto);
        response.setRestaurantName(restaurant.getRestaurantName());
        response.setLogoUrl(restaurant.getLogoUrl());
        response.setDescription(restaurant.getDescription());
        response.setEmail(restaurant.getEmail());
        response.setPhone(restaurant.getPhone());
        response.setWebsite(restaurant.getWebsite());
        response.setCuisineType(restaurant.getCuisineType());
        
        return response;
    }

    public RestaurantDetailResponse toDetailResponse(
            Restaurant restaurant,
            List<Branch> branches,
            Map<Long, List<BranchImage>> imagesByBranchMap,
            Map<Long, Double> ratingMap         // Thêm map điểm đánh giá
    ) {

        // Map thông tin cơ bản của nhà hàng + Owner (dùng lại hàm toResponse cũ của bạn)
        RestaurantResponse baseResponse = toResponse(restaurant);

        RestaurantDetailResponse detailResponse = new RestaurantDetailResponse();
        detailResponse.setId(baseResponse.getId());
        detailResponse.setApprovalStatus(baseResponse.getApprovalStatus());
        detailResponse.setOwner(baseResponse.getOwner());
        detailResponse.setRestaurantName(baseResponse.getRestaurantName());
        detailResponse.setLogoUrl(baseResponse.getLogoUrl());
        detailResponse.setDescription(baseResponse.getDescription());
        detailResponse.setEmail(baseResponse.getEmail());
        detailResponse.setPhone(baseResponse.getPhone());
        detailResponse.setWebsite(baseResponse.getWebsite());
        detailResponse.setCuisineType(baseResponse.getCuisineType());

        // Map danh sách Branch và gán thêm operatingCurrentDay, rate cùng ảnh tương ứng
        List<BranchResponse> branchResponses = branches.stream().map(branch -> {
            BranchResponse branchRes = new BranchResponse();
            branchRes.setId(branch.getId());
            branchRes.setRestaurantId(branch.getRestaurant().getId().intValue());
            branchRes.setName(branch.getName());
            branchRes.setProvince(branch.getProvince());
            branchRes.setAddress(branch.getAddress());
            branchRes.setPhone(branch.getPhone());
            branchRes.setLatitude(branch.getLatitude());
            branchRes.setLongitude(branch.getLongitude());
            branchRes.setStatus(branch.getStatus());
            branchRes.setCreatedAt(branch.getCreatedAt());
            branchRes.setUpdatedAt(branch.getUpdatedAt());

            // Gán giờ hoạt động hiện tại (lấy từ Map truyền vào)

            // Gán số sao trung bình (lấy từ Map truyền vào, mặc định 0.0)
            branchRes.setRate(ratingMap.getOrDefault(branch.getId(), 0.0));

            // Lấy danh sách ảnh từ Map dựa theo branch.getId()
            List<BranchImage> images = imagesByBranchMap.getOrDefault(branch.getId(), List.of());
            List<BranchImageDto> imageDtos = images.stream().map(img -> {
                BranchImageDto imgDto = new BranchImageDto();
                imgDto.setId(img.getId());
                imgDto.setImageUrl(img.getImageUrl());
                imgDto.setDisplayOrder(img.getDisplayOrder());
                return imgDto;
            }).toList();

            branchRes.setBranchImageDtos(imageDtos);
            return branchRes;
        }).toList();

        detailResponse.setBranches(branchResponses);
        return detailResponse;
    }
}