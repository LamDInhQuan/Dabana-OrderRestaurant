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
import com.dabana.backend.modules.branch2.dto.request.BranchUpdateRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchImage;
import com.dabana.backend.modules.branch2.mapper.BranchMapper;
import com.dabana.backend.modules.branch2.repository.BranchImageRepository;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.subscription.service.ISubscriptionService;
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

import java.util.Collections;
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
    private final BranchImageRepository branchImageRepository;
    private final BranchMapper branchMapper;
    private final RestaurantRepository restaurantRepository;
    private final ISubscriptionService subscriptionService;

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
        List<Branch> branches = branchRepository.findAll();
        return branches.stream()
                .map(branch -> branchMapper.toResponse(branch)) // Hoặc dùng new BranchResponse(branch) tuỳ dự án của bạn
                .toList();
    }

    @Override
    public BranchResponse findById(Long id) {
        return branchRepository.findById(id)
                .map(branch -> branchMapper.toResponse(branch))
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));
    }

    @Override
    public BranchResponse create(BranchRequest request) {
        // Kiem tra han muc chi nhanh theo goi subscription dang active cua nha hang
        // (request.getRestaurantId() la Integer - ep sang Long vi Restaurant.id la Long)
        subscriptionService.assertCanAddBranch(request.getRestaurantId().longValue());

        if (branchRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException(BranchErrorCode.DUPLICATE_PHONE);
        }
        com.dabana.backend.modules.branch2.entity.Branch branch = branchMapper.toEntity(request);
        initializeAdditionalData(branch, request);
        return branchMapper.toResponse(branchRepository.save(branch));
    }

//    @Override
//    public BranchResponse update(Long id, Branch branch) {
//        return null;
//    }

    @Override
    public void delete(Long id) {

    }

    @Override
    public List<BranchResponse> findBranchesByManager(Long managerId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerUserId(managerId);
        if (restaurantOpt.isEmpty()) {
            return Collections.emptyList(); // Nếu user chưa tạo nhà hàng thì trả về danh sách rỗng
        }
        Long restaurantId = restaurantOpt.get().getId();
        // 2. Có restaurantId rồi thì tận dụng luôn hàm findByRestaurant bạn đã viết sẵn ở trên kìa!
        return this.findByRestaurant(restaurantId);
    }

    private void initializeAdditionalData(Branch branch, BranchRequest request) {
        // 1. Xử lý mock Restaurant relation
        if (request.getRestaurantId() != null) {
            Restaurant mockRestaurant = new Restaurant();
            mockRestaurant.setId(request.getRestaurantId().longValue());
            branch.setRestaurant(mockRestaurant);
        }
        branch.setStatus(BranchStatus.ACTIVE.getStatus());
        if (request.getBranchImages() != null) {
            branch.setImages(request.getBranchImages().stream().map(dto ->
                    BranchImage.builder()
                            .branch(branch) // Link ngược lại cha
                            .imageUrl(dto.getImageUrl())
                            .isCover(dto.getIsCover())
                            .displayOrder(dto.getDisplayOrder())
                            .build()
            ).toList());
        }

    }

    @Override
    @Transactional
    public BranchResponse update(Long id, BranchUpdateRequest request) {
        // 1. Kiểm tra chi nhánh tồn tại hay không
        Branch existingBranch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        // 2. Cập nhật các trường thông tin cơ bản
        existingBranch.setName(request.getName());
        existingBranch.setAddress(request.getAddress());
        existingBranch.setProvince(request.getProvince());
        existingBranch.setPhone(request.getPhone());
        existingBranch.setLatitude(request.getLatitude());
        existingBranch.setLongitude(request.getLongitude());
        if (request.getBranchImages() != null) {
            // Xóa sạch list ảnh cũ trong Hibernate (cần có orphanRemoval = true ở Entity)
            existingBranch.getImages().clear();
            // Tạo list ảnh mới và add vào collection hiện tại của existingBranch
            List<BranchImage> newImages = request.getBranchImages().stream().map(dto ->
                    BranchImage.builder()
                            .branch(existingBranch)
                            .imageUrl(dto.getImageUrl())
                            .isCover(dto.getIsCover() != null ? dto.getIsCover() : 0)
                            .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 1)
                            .build()
            ).toList();
            existingBranch.getImages().addAll(newImages);
        }
        // (Tuỳ chọn) Xử lý cập nhật danh sách ảnh hoặc các thông tin liên quan khác nếu có trong request...
        // 3. Lưu vào cơ sở dữ liệu
        Branch savedBranch = branchRepository.save(existingBranch);
        // 4. Trả về kết quả Response DTO
        return branchMapper.toResponse(savedBranch);
    }
}
