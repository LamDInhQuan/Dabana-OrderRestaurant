package com.dabana.backend.modules.branch2.mapper;

import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import org.springframework.stereotype.Component;

@Component
public class BranchMapper {
    public com.dabana.backend.modules.branch2.entity.Branch toEntity(BranchRequest request) {
        com.dabana.backend.modules.branch2.entity.Branch branch = new com.dabana.backend.modules.branch2.entity.Branch();
        branch.setName(request.getName());
        branch.setProvince(request.getProvince());
        branch.setPhone(request.getPhone());
        branch.setAddress(request.getPhone());
        branch.setLatitude(request.getLatitude());
        branch.setLongitude(request.getLongitude());
        return branch;
    }

    public BranchResponse toResponse(com.dabana.backend.modules.branch2.entity.Branch branch) {
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
        return response;
    }
}
