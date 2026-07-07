package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.exception.BusinessException;
//import com.dabana.backend.modules.auth.OtpService;
import com.dabana.backend.modules.auth.service.IAuthService;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.Role;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.entity.UserRole;
import com.dabana.backend.modules.auth.mapper.UserMapper;
import com.dabana.backend.modules.auth.repository.RoleRepository;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.auth.repository.UserRoleRepository;
import com.dabana.backend.modules.auth.util.AccountStatus;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.auth.util.RoleUser;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.mapper.BranchMapper;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.restaurant.Restaurant;
import com.dabana.backend.security.CustomUserDetail;
import com.dabana.backend.security.CustomUserDetailsService;
import com.dabana.backend.security.JwtService;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

/**
 * Trien khai dac ta B02: Dang ky va tro thanh nha hang doi tac
 * (va dang ky khach hang thong thuong dung chung quy trinh don gian hoa).
 */
@Service
@RequiredArgsConstructor
public class BranchService implements IBranchService {

    private final BranchRepository branchRepository;
    private final BranchMapper branchMapper;

    @Override
    public List<BranchResponse> findByRestaurant(Long restaurantId) {
        // 2. Gọi Repo lấy thẳng list branch từ DB lên (chỉ quét bảng rt_branches)
        List<Branch> branches = branchRepository.findByRestaurantId(restaurantId);
        // 3. Map sang danh sách Response trả về cho Frontend
        return branches.stream()
                .map(branchMapper::toResponse)
                .toList();
    }

    @Override
    public List<BranchResponse> findAll() {
        return List.of();
    }

    @Override
    public Optional<BranchResponse> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public BranchResponse create(BranchRequest request) {
        com.dabana.backend.modules.branch2.entity.Branch branch = branchMapper.toEntity(request) ;
        Restaurant mockRestaurant = new Restaurant();
        mockRestaurant.setId(request.getRestaurantId().longValue()); // Set đúng ID nhà hàng đang có dưới DB
        branch.setRestaurant(mockRestaurant);
        branch.setStatus(BranchStatus.PENDING.getStatus());
        BranchResponse branchResponse = branchMapper.toResponse(branchRepository.save(branch));
        return branchResponse;
    }

//    @Override
//    public BranchResponse update(Long id, Branch branch) {
//        return null;
//    }

    @Override
    public void delete(Long id) {

    }
}
