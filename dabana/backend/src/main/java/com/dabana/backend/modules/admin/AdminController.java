package com.dabana.backend.modules.admin;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.admin.entity.SystemCategory;
import com.dabana.backend.modules.admin.repository.SystemCategoryRepository;
import com.dabana.backend.modules.admin.util.AdminErrorCode;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.mapper.UserMapper;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.auth.util.AccountStatus;
import com.dabana.backend.modules.auth.util.RoleUser;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.review.Review;
import com.dabana.backend.modules.review.ReviewRepository;
import com.dabana.backend.modules.auth.service.MailService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * /api/admin/** - Cac chuc nang doc quyen Quan tri vien (F41, F43-F50):
 * - F43: phe duyet ho so nha hang & chi nhanh (B02/B03/B04)
 * - F44: quan ly tai khoan nguoi dung toan he thong (xem/khoa/mo khoa)
 * - F45: quan ly danh muc dung chung cua he thong
 * - F41: kiem duyet danh gia
 * - F46: giam sat hoat dong nen tang
 * - F47/F48/F49: bao cao doanh thu, thong ke dat ban, bao cao tong hop
 * - F50: xuat bao cao ra CSV (tuong thich Excel)
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final ReviewRepository reviewRepository;
    private final SystemCategoryRepository systemCategoryRepository;
    private final BookingRepository bookingRepository;
    private final MailService mailService;

    // ======================================================
    // DTOs dung chung
    // ======================================================
    @Data
    public static class ApprovalRequest {
        private Boolean approved;
        private String reason; // ly do tu choi khi approved = false
    }

    @Data
    public static class LockRequest {
        private Boolean locked;
        private String reason;
    }

    @Data
    public static class ModerationRequest {
        private String reason;
    }

    @Data
    public static class CategoryRequest {
        @NotBlank
        private String categoryType;
        @NotBlank
        private String categoryName;
    }

    // ======================================================
    // F44: Quan ly tai khoan nguoi dung toan he thong
    // ======================================================

    /**
     * Danh sach tai khoan doi tac dang cho duyet (B02 buoc 4).
     */
    @GetMapping("/users/pending")
    public ResponseEntity<List<UserResponse>> listPendingUsers() {
        List<UserResponse> data = userRepository
                .searchUsers(RoleUser.RESTAURANT_PARTNER.name(), AccountStatus.PENDING_ADMIN.getStatus(), null,
                        PageRequest.of(0, 200, Sort.by("createdAt").descending()))
                .stream().map(userMapper::userResponse).toList();
        return ResponseEntity.ok(data);
    }

    /**
     * F44: tim kiem/loc tai khoan Khach hang & Nha hang doi tac toan he thong.
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<User> users = userRepository.searchUsers(role, status, blankToNull(keyword),
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(users.map(userMapper::userResponse));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserDetail(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.USER_NOT_FOUND));
        return ResponseEntity.ok(userMapper.userResponse(user));
    }

    /**
     * B02 buoc 4-5: phe duyet/tu choi dang ky tai khoan doi tac.
     */
    @PostMapping("/users/{id}/approve")
    @Transactional
    public ResponseEntity<UserResponse> approveUser(@PathVariable Long id, @RequestBody ApprovalRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.USER_NOT_FOUND));

        // Kiểm tra trạng thái phù hợp nếu cần thiết (ví dụ: PENDING_ADMIN, PENDING_OTP...)

        // Lấy thông tin nhà hàng liên kết trước để dùng cho việc cập nhật và gửi email
        Restaurant restaurant = restaurantRepository.findByOwnerUserId(id).orElse(null);
        String restaurantName = (restaurant != null) ? restaurant.getRestaurantName() : null;

        if (Boolean.TRUE.equals(req.getApproved())) {
            user.setStatus(AccountStatus.ACTIVE.getStatus());
            user.setStatusReason(null);

            // Phê duyệt nhà hàng liên quan
            if (restaurant != null) {
                restaurant.setApprovalStatus(ApprovalStatus.APPROVED);
                restaurantRepository.save(restaurant);
            }
        } else {
            user.setStatus(AccountStatus.REJECTED.getStatus());
            user.setStatusReason(req.getReason());

            // Từ chối nhà hàng liên quan
            if (restaurant != null) {
                restaurant.setApprovalStatus(ApprovalStatus.REJECTED);
                restaurantRepository.save(restaurant);

                // Hoặc nếu anh muốn xóa luôn bản ghi nhà hàng khi bị từ chối thì bật dòng dưới lên:
                // restaurantRepository.delete(restaurant);
            }
        }

        User saved = userRepository.save(user);

        // Gửi email thông báo kết quả duyệt kèm tên nhà hàng
        if (Boolean.TRUE.equals(req.getApproved())) {
            mailService.sendPartnerApprovedEmail(saved.getEmail(), saved.getFullName(), restaurantName);
        } else {
            mailService.sendPartnerRejectedEmail(saved.getEmail(), saved.getFullName(), restaurantName, req.getReason());
        }

        return ResponseEntity.ok(userMapper.userResponse(saved));
    }
    /**
     * F44: khoa/mo khoa tai khoan Khach hang hoac Nha hang doi tac.
     */
    @PostMapping("/users/{id}/lock")
    @Transactional
    public ResponseEntity<UserResponse> lockUser(@PathVariable Long id, @RequestBody LockRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.USER_NOT_FOUND));

        boolean isAdmin = user.getUserRoles().stream()
                .anyMatch(ur -> RoleUser.ADMIN.name().equals(ur.getRole().getName()));
        if (isAdmin) {
            throw new BusinessException(AdminErrorCode.CANNOT_LOCK_ADMIN);
        }

        if (Boolean.TRUE.equals(req.getLocked())) {
            user.setStatus(AccountStatus.SUSPENDED.getStatus());
            user.setStatusReason(req.getReason());
        } else {
            user.setStatus(AccountStatus.ACTIVE.getStatus());
            user.setStatusReason(null);
        }
        return ResponseEntity.ok(userMapper.userResponse(userRepository.save(user)));
    }

    // ======================================================
    // F43: Phe duyet ho so nha hang (B03)
    // ======================================================
//    @GetMapping("/restaurants/pending")
//    public ResponseEntity<List<Restaurant>> listPendingRestaurants() {
//        List<Restaurant> pending = new ArrayList<>(restaurantRepository.findByApprovalStatus(ApprovalStatus.PENDING));
//        pending.addAll(restaurantRepository.findByApprovalStatus(ApprovalStatus.PENDING_UPDATE));
//        return ResponseEntity.ok(pending);
//    }
//
//    @GetMapping("/restaurants")
//    public ResponseEntity<Page<Restaurant>> searchRestaurants(
//            @RequestParam(required = false) ApprovalStatus status,
//            @RequestParam(required = false) String keyword,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size) {
//        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
//        Page<Restaurant> result = status != null
//                ? restaurantRepository.findByApprovalStatus(status, pageable)
//                : restaurantRepository.searchByKeyword(blankToNull(keyword), pageable);
//        return ResponseEntity.ok(result);
//    }

//    @PostMapping("/restaurants/{id}/approve")
//    @Transactional
//    public ResponseEntity<Restaurant> approveRestaurant(@PathVariable Long id, @RequestBody ApprovalRequest req) {
//        Restaurant restaurant = restaurantRepository.findById(id)
//                .orElseThrow(() -> new BusinessException(AdminErrorCode.RESTAURANT_NOT_FOUND));
//
//        if (Boolean.TRUE.equals(req.getApproved())) {
//            restaurant.setApprovalStatus(ApprovalStatus.APPROVED);
//
//            //lúc đăng ký đã có logo với mô tả r ko cần phải update lại
//            // if (restaurant.getLogoUrl() != null) {
//            //     restaurant.setLogoUrl(restaurant.getPendingLogoUrl());
//
//            // }
//            // if (restaurant.getPendingDescription() != null) {
//            //     restaurant.setDescription(restaurant.getPendingDescription());
//            //     restaurant.setPendingDescription(null);
//            // }
//        } else {
//            restaurant.setApprovalStatus(ApprovalStatus.REJECTED);
//            // restaurant.setRejectionReason(req.getReason());
//        }
//
//        return ResponseEntity.ok(restaurantRepository.save(restaurant));
//    }


    // ======================================================
    // B04: Phe duyet chi nhanh
    // ======================================================
//    @GetMapping("/branches/pending")
//    public ResponseEntity<List<Branch>> listPendingBranches() {
//        return ResponseEntity.ok(branchRepository.findByApprovalStatus(ApprovalStatus.PENDING));
//    }

//    @GetMapping("/branches")
//    public ResponseEntity<Page<Branch>> searchBranches(
//            @RequestParam(required = false) ApprovalStatus status,
//            @RequestParam(required = false) String keyword,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size) {
//        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
//        Page<Branch> result = status != null
//                ? branchRepository.findByApprovalStatus(status, pageable)
//                : branchRepository.searchByKeyword(blankToNull(keyword), pageable);
//        return ResponseEntity.ok(result);
//    }

//    @PostMapping("/branches/{id}/approve")
//    @Transactional
//    public ResponseEntity<Branch> approveBranch(@PathVariable Long id, @RequestBody ApprovalRequest req) {
//        Branch branch = branchRepository.findById(id)
//                .orElseThrow(() -> new BusinessException(AdminErrorCode.BRANCH_NOT_FOUND));
//
//        if (Boolean.TRUE.equals(req.getApproved())) {
//            branch.setApprovalStatus(ApprovalStatus.APPROVED);
//            branch.setRejectionReason(null);
//        } else {
//            branch.setApprovalStatus(ApprovalStatus.REJECTED);
//            branch.setRejectionReason(req.getReason());
//        }
//
//        return ResponseEntity.ok(branchRepository.save(branch));
//    }

    // ======================================================
    // F41: Kiem duyet danh gia
    // ======================================================
    @GetMapping("/reviews")
    public ResponseEntity<Page<Review>> listReviews(
            @RequestParam(required = false) Boolean hidden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> result = hidden != null
                ? reviewRepository.findByHidden(hidden, pageable)
                : reviewRepository.findAll(pageable);
        return ResponseEntity.ok(result);
    }

    /**
     * F41: an danh gia ao/vi pham khoi hien thi cong khai.
     */
    @PostMapping("/reviews/{id}/hide")
    @Transactional
    public ResponseEntity<Review> hideReview(@PathVariable Long id, @RequestBody ModerationRequest req) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.REVIEW_NOT_FOUND));
        review.setHidden(true);
        review.setModerationNote(req.getReason());
        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @PostMapping("/reviews/{id}/unhide")
    @Transactional
    public ResponseEntity<Review> unhideReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.REVIEW_NOT_FOUND));
        review.setHidden(false);
        review.setModerationNote(null);
        return ResponseEntity.ok(reviewRepository.save(review));
    }

    /**
     * F41: xoa hoan toan danh gia vi pham nghiem trong.
     */
    @DeleteMapping("/reviews/{id}")
    @Transactional
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new BusinessException(AdminErrorCode.REVIEW_NOT_FOUND);
        }
        reviewRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ======================================================
    // F45: Quan ly danh muc dung chung cua he thong
    // ======================================================
    @GetMapping("/categories")
    public ResponseEntity<List<SystemCategory>> listCategories(@RequestParam(required = false) String type) {
        List<SystemCategory> data = (type == null || type.isBlank())
                ? systemCategoryRepository.findAllByOrderByCategoryTypeAscCategoryNameAsc()
                : systemCategoryRepository.findByCategoryTypeOrderByCategoryNameAsc(type);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/categories")
    @Transactional
    public ResponseEntity<SystemCategory> createCategory(@jakarta.validation.Valid @RequestBody CategoryRequest req) {
// 1. Chuẩn hóa categoryType và categoryName trước khi kiểm tra tồn tại và lưu vào DB
        String rawType = req.getCategoryType() != null ? req.getCategoryType().trim().toUpperCase() : "";
        String rawName = req.getCategoryName() != null ? req.getCategoryName().trim() : "";

        // 2. Đảm bảo luôn có tiền tố "CUISINE_" nếu phía Client chưa gửi lên
        final String finalType = rawType.startsWith("CUISINE_") ? rawType : "CUISINE_" + rawType;

        if (systemCategoryRepository.existsByCategoryTypeAndCategoryNameIgnoreCase(finalType, rawName)) {
            throw new BusinessException(AdminErrorCode.CATEGORY_ALREADY_EXISTS);
        }

        SystemCategory category = new SystemCategory();
        category.setCategoryType(finalType);
        category.setCategoryName(rawName);

        return ResponseEntity.ok(systemCategoryRepository.save(category));
    }

    @PutMapping("/categories/{id}")
    @Transactional
    public ResponseEntity<SystemCategory> updateCategory(@PathVariable Long id, @jakarta.validation.Valid @RequestBody CategoryRequest req) {
        SystemCategory category = systemCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.CATEGORY_NOT_FOUND));
        category.setCategoryType(req.getCategoryType().trim());
        category.setCategoryName(req.getCategoryName().trim());
        return ResponseEntity.ok(systemCategoryRepository.save(category));
    }

    @DeleteMapping("/categories/{id}")
    @Transactional
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!systemCategoryRepository.existsById(id)) {
            throw new BusinessException(AdminErrorCode.CATEGORY_NOT_FOUND);
        }
        systemCategoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ======================================================
    // F46: Giam sat hoat dong nen tang
    // ======================================================
    @GetMapping("/activity/recent")
    public ResponseEntity<List<Map<String, Object>>> recentActivity(
            @RequestParam(defaultValue = "20") int limit) {
        List<Map<String, Object>> events = new ArrayList<>();

        userRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .forEach(u -> events.add(activityEvent("USER_REGISTERED", u.getCreatedAt(),
                        u.getFullName() + " vừa đăng ký tài khoản")));

        restaurantRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .forEach(r -> events.add(activityEvent("RESTAURANT_SUBMITTED", r.getCreatedAt(),
                        "Nhà hàng \"" + r.getRestaurantName() + "\" nộp hồ sơ (" + r.getApprovalStatus() + ")")));

//        branchRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
//                .forEach(b -> events.add(activityEvent("BRANCH_SUBMITTED", b.getCreatedAt(),
//                        "Chi nhánh \"" + b.getName() + "\" nộp hồ sơ (" + b.getApprovalStatus() + ")")));

        bookingRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .forEach(bk -> events.add(activityEvent("BOOKING_CREATED", bk.getCreatedAt(),
                        "Đơn đặt bàn #" + bk.getId() + " - " + bk.getStatus())));

        reviewRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .forEach(rv -> events.add(activityEvent("REVIEW_POSTED", rv.getCreatedAt(),
                        "Đánh giá mới #" + rv.getId() + (Boolean.TRUE.equals(rv.getHidden()) ? " (đã ẩn)" : ""))));

        events.sort((a, b) -> ((LocalDateTime) b.get("time")).compareTo((LocalDateTime) a.get("time")));
        return ResponseEntity.ok(events.stream().limit(limit).toList());
    }

    private Map<String, Object> activityEvent(String type, LocalDateTime time, String message) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("type", type);
        event.put("time", time);
        event.put("message", message);
        return event;
    }
    private String csvRow(Object... values) {
        return Arrays.stream(values)
                .map(v -> v == null ? "" : v.toString().replace("\"", "\"\""))
                .map(v -> "\"" + v + "\"")
                .collect(Collectors.joining(","));
    }
    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
