package com.dabana.backend.modules.admin;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.AccountStatus;
import com.dabana.backend.modules.auth.User;
import com.dabana.backend.modules.auth.UserRepository;
import com.dabana.backend.modules.branch.Branch;
import com.dabana.backend.modules.branch.BranchRepository;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Restaurant;
import com.dabana.backend.modules.restaurant.RestaurantRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * /api/admin/** - Cac chuc nang doc quyen Quan tri vien:
 * B02 buoc 4-5: phe duyet/tu choi tai khoan nha hang doi tac.
 * B03/B04: phe duyet ho so nha hang va chi nhanh.
 * B15: bao cao tong hop toan nen tang.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;

    @Data
    public static class ApprovalRequest {
        private Boolean approved;
        private String reason; // B02 EF04: ly do tu choi
    }

    // ======================================================
    // B02 Buoc 4-5: Phe duyet tai khoan doi tac
    // ======================================================
    @GetMapping("/users/pending")
    public ResponseEntity<List<User>> listPendingUsers() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .filter(u -> u.getStatus() == AccountStatus.PENDING_ADMIN)
                        .toList());
    }

    @PostMapping("/users/{id}/approve")
    @Transactional
    public ResponseEntity<User> approveUser(@PathVariable Long id, @RequestBody ApprovalRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Khong tim thay nguoi dung"));

        if (user.getStatus() != AccountStatus.PENDING_ADMIN) {
            throw new BusinessException("INVALID_STATE", "Tai khoan khong o trang thai cho duyet");
        }

        if (Boolean.TRUE.equals(req.getApproved())) {
            user.setStatus(AccountStatus.ACTIVE); // B02 Buoc 5
        } else {
            user.setStatus(AccountStatus.REJECTED); // EF04
            user.setRejectionReason(req.getReason());
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    // ======================================================
    // B03: Phe duyet ho so nha hang
    // ======================================================
    @GetMapping("/restaurants/pending")
    public ResponseEntity<List<Restaurant>> listPendingRestaurants() {
        return ResponseEntity.ok(
                restaurantRepository.findAll().stream()
                        .filter(r -> r.getStatus() == ApprovalStatus.PENDING
                                  || r.getStatus() == ApprovalStatus.PENDING_UPDATE)
                        .toList());
    }

    @PostMapping("/restaurants/{id}/approve")
    @Transactional
    public ResponseEntity<Restaurant> approveRestaurant(@PathVariable Long id, @RequestBody ApprovalRequest req) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new BusinessException("RESTAURANT_NOT_FOUND", "Khong tim thay nha hang"));

        if (Boolean.TRUE.equals(req.getApproved())) {
            restaurant.setStatus(ApprovalStatus.APPROVED);
            // Ap dung ban cap nhat dang cho (AF02 cua B03) neu co
            if (restaurant.getPendingLogoUrl() != null) {
                restaurant.setLogoUrl(restaurant.getPendingLogoUrl());
                restaurant.setPendingLogoUrl(null);
            }
        } else {
            restaurant.setStatus(ApprovalStatus.REJECTED);
            restaurant.setRejectionReason(req.getReason());
        }

        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    // ======================================================
    // B04: Phe duyet chi nhanh
    // ======================================================
    @GetMapping("/branches/pending")
    public ResponseEntity<List<Branch>> listPendingBranches() {
        return ResponseEntity.ok(branchRepository.findByApprovalStatus(ApprovalStatus.PENDING));
    }

    @PostMapping("/branches/{id}/approve")
    @Transactional
    public ResponseEntity<Branch> approveBranch(@PathVariable Long id, @RequestBody ApprovalRequest req) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException("BRANCH_NOT_FOUND", "Khong tim thay chi nhanh"));

        if (Boolean.TRUE.equals(req.getApproved())) {
            branch.setApprovalStatus(ApprovalStatus.APPROVED); // B04 Buoc 4
        } else {
            branch.setApprovalStatus(ApprovalStatus.REJECTED);
            branch.setRejectionReason(req.getReason());
        }

        return ResponseEntity.ok(branchRepository.save(branch));
    }

    // ======================================================
    // B15: Bao cao tong hop toan nen tang (Admin)
    // ======================================================
    @GetMapping("/statistics/platform/summary")
    public ResponseEntity<Object> platformSummary() {
        long totalUsers = userRepository.count();
        long totalRestaurants = restaurantRepository.count();
        long totalBranches = branchRepository.count();

        return ResponseEntity.ok(java.util.Map.of(
                "totalUsers", totalUsers,
                "totalRestaurants", totalRestaurants,
                "totalBranches", totalBranches
        ));
    }
}
