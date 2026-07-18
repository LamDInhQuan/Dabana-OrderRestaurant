package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;

import java.util.List;
import java.util.Optional;

public interface IBranchService {
    List<BranchResponse> findByRestaurant(Long restaurantId);
    List<BranchResponse> findAll();
    Optional<BranchResponse> findById(Long id);
    BranchResponse create(BranchRequest branch);
//    BranchResponse update(Long id, BranchResponse branch); // Hàm xử lý merge đè
    void delete(Long id);
}
