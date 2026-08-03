package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.request.BranchUpdateRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchAvailabilityResponse;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IBranchService {
    List<BranchResponse> findByRestaurant(Long restaurantId);

    List<BranchResponse> findAll();

    BranchResponse findById(Long id , LocalDate date);

    BranchResponse create(BranchRequest branch);

    List<BranchResponse> findBranchesByManager(Long managerId);

    //    BranchResponse update(Long id, BranchResponse branch); // Hàm xử lý merge đè
    void delete(Long id);

    BranchResponse update(Long id, BranchUpdateRequest branch);

    List<BranchAvailabilityResponse> searchAvailableBranches(LocalDate date, String city, Integer guests);

    List<Branch> getActiveBranches(String city);
}
