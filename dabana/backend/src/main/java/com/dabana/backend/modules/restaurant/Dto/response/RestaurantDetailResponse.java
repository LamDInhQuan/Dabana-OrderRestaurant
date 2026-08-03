package com.dabana.backend.modules.restaurant.Dto.response;

import com.dabana.backend.modules.branch2.dto.response.BranchResponse;

import java.util.List;

public class RestaurantDetailResponse extends RestaurantResponse {
    private List<BranchResponse> branches; // Hoặc kiểu dữ liệu chi nhánh tương ứng của bạn

    // Getter & Setter
    public List<BranchResponse> getBranches() { return branches; }
    public void setBranches(List<BranchResponse> branches) { this.branches = branches; }
}