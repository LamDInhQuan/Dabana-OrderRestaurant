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
import com.dabana.backend.modules.restaurant.RestaurantRepository;
import com.dabana.backend.modules.review.Review;
import com.dabana.backend.modules.review.ReviewRepository;
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

    /** Danh sach tai khoan doi tac dang cho duyet (B02 buoc 4). */
    @GetMapping("/users/pending")
    public ResponseEntity<List<UserResponse>> listPendingUsers() {
        List<UserResponse> data = userRepository
                .searchUsers(RoleUser.RESTAURANT_PARTNER.name(), AccountStatus.PENDING_ADMIN.getStatus(), null,
                        PageRequest.of(0, 200, Sort.by("createdAt").descending()))
                .stream().map(userMapper::userResponse).toList();
        return ResponseEntity.ok(data);
    }

    /** F44: tim kiem/loc tai khoan Khach hang & Nha hang doi tac toan he thong. */
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

    /** B02 buoc 4-5: phe duyet/tu choi dang ky tai khoan doi tac. */
    @PostMapping("/users/{id}/approve")
    @Transactional
    public ResponseEntity<UserResponse> approveUser(@PathVariable Long id, @RequestBody ApprovalRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.USER_NOT_FOUND));

        if (!Objects.equals(user.getStatus(), AccountStatus.PENDING_ADMIN.getStatus())) {
            throw new BusinessException(AdminErrorCode.INVALID_STATE);
        }

        if (Boolean.TRUE.equals(req.getApproved())) {
            user.setStatus(AccountStatus.ACTIVE.getStatus());
            user.setStatusReason(null);
        } else {
            user.setStatus(AccountStatus.REJECTED.getStatus());
            user.setStatusReason(req.getReason());
        }
        return ResponseEntity.ok(userMapper.userResponse(userRepository.save(user)));
    }

    /** F44: khoa/mo khoa tai khoan Khach hang hoac Nha hang doi tac. */
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
    @GetMapping("/restaurants/pending")
    public ResponseEntity<List<Restaurant>> listPendingRestaurants() {
        List<Restaurant> pending = new ArrayList<>(restaurantRepository.findByApprovalStatus(ApprovalStatus.PENDING));
        pending.addAll(restaurantRepository.findByApprovalStatus(ApprovalStatus.PENDING_UPDATE));
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/restaurants")
    public ResponseEntity<Page<Restaurant>> searchRestaurants(
            @RequestParam(required = false) ApprovalStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Restaurant> result = status != null
                ? restaurantRepository.findByApprovalStatus(status, pageable)
                : restaurantRepository.searchByKeyword(blankToNull(keyword), pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/restaurants/{id}/approve")
    @Transactional
    public ResponseEntity<Restaurant> approveRestaurant(@PathVariable Long id, @RequestBody ApprovalRequest req) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.RESTAURANT_NOT_FOUND));

        if (Boolean.TRUE.equals(req.getApproved())) {
            restaurant.setApprovalStatus(ApprovalStatus.APPROVED);
            
            //lúc đăng ký đã có logo với mô tả r ko cần phải update lại 
            // if (restaurant.getLogoUrl() != null) {
            //     restaurant.setLogoUrl(restaurant.getPendingLogoUrl());
                
            // }
            // if (restaurant.getPendingDescription() != null) {
            //     restaurant.setDescription(restaurant.getPendingDescription());
            //     restaurant.setPendingDescription(null);
            // }
        } else {
            restaurant.setApprovalStatus(ApprovalStatus.REJECTED);
            // restaurant.setRejectionReason(req.getReason());
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

    @GetMapping("/branches")
    public ResponseEntity<Page<Branch>> searchBranches(
            @RequestParam(required = false) ApprovalStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Branch> result = status != null
                ? branchRepository.findByApprovalStatus(status, pageable)
                : branchRepository.searchByKeyword(blankToNull(keyword), pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/branches/{id}/approve")
    @Transactional
    public ResponseEntity<Branch> approveBranch(@PathVariable Long id, @RequestBody ApprovalRequest req) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(AdminErrorCode.BRANCH_NOT_FOUND));

        if (Boolean.TRUE.equals(req.getApproved())) {
            branch.setApprovalStatus(ApprovalStatus.APPROVED);
            branch.setRejectionReason(null);
        } else {
            branch.setApprovalStatus(ApprovalStatus.REJECTED);
            branch.setRejectionReason(req.getReason());
        }

        return ResponseEntity.ok(branchRepository.save(branch));
    }

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

    /** F41: an danh gia ao/vi pham khoi hien thi cong khai. */
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

    /** F41: xoa hoan toan danh gia vi pham nghiem trong. */
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
        if (systemCategoryRepository.existsByCategoryTypeAndCategoryNameIgnoreCase(req.getCategoryType(), req.getCategoryName())) {
            throw new BusinessException(AdminErrorCode.CATEGORY_ALREADY_EXISTS);
        }
        SystemCategory category = new SystemCategory();
        category.setCategoryType(req.getCategoryType().trim());
        category.setCategoryName(req.getCategoryName().trim());
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

        branchRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .forEach(b -> events.add(activityEvent("BRANCH_SUBMITTED", b.getCreatedAt(),
                        "Chi nhánh \"" + b.getName() + "\" nộp hồ sơ (" + b.getApprovalStatus() + ")")));

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

    // ======================================================
    // F49: Bao cao tong hop toan he thong
    // ======================================================
    @GetMapping("/statistics/platform/summary")
    public ResponseEntity<Map<String, Object>> platformSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalUsers", userRepository.count());
        summary.put("totalActiveUsers", userRepository.countByStatus(AccountStatus.ACTIVE.getStatus()));
        summary.put("totalRestaurants", restaurantRepository.count());
        summary.put("totalBranches", branchRepository.count());
        summary.put("totalBookings", bookingRepository.count());
        summary.put("totalReviews", reviewRepository.count());

        summary.put("pendingUserApprovals", userRepository.countByStatus(AccountStatus.PENDING_ADMIN.getStatus()));
        summary.put("pendingRestaurantApprovals", restaurantRepository.countByApprovalStatus(ApprovalStatus.PENDING));
        summary.put("pendingBranchApprovals", branchRepository.countByApprovalStatus(ApprovalStatus.PENDING));
        summary.put("hiddenReviews", reviewRepository.countByHidden(true));

        summary.put("completedBookings", bookingRepository.countByStatus(BookingStatus.COMPLETED));
        summary.put("cancelledBookings",
                bookingRepository.countByStatus(BookingStatus.CANCELLED_BY_CUSTOMER)
                        + bookingRepository.countByStatus(BookingStatus.CANCELLED_BY_RESTAURANT));
        summary.put("noShowBookings", bookingRepository.countByStatus(BookingStatus.NO_SHOW));

        BigDecimal totalRevenue = bookingRepository.sumDepositRevenueByBranch().stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.put("totalRevenue", totalRevenue);

        return ResponseEntity.ok(summary);
    }

    // ======================================================
    // F47: Bao cao doanh thu theo nha hang
    // ======================================================
    @GetMapping("/statistics/revenue-by-restaurant")
    public ResponseEntity<List<Map<String, Object>>> revenueByRestaurant() {
        Map<Long, BigDecimal> revenueByBranch = new HashMap<>();
        Map<Long, Long> completedByBranch = new HashMap<>();
        for (Object[] row : bookingRepository.sumDepositRevenueByBranch()) {
            Long branchId = (Long) row[0];
            revenueByBranch.put(branchId, (BigDecimal) row[1]);
            completedByBranch.put(branchId, (Long) row[2]);
        }

        Map<Long, List<Branch>> branchesByRestaurant = branchRepository.findAll().stream()
                .collect(Collectors.groupingBy(b -> b.getRestaurant().getId()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Restaurant restaurant : restaurantRepository.findAll()) {
            List<Branch> branches = branchesByRestaurant.getOrDefault(restaurant.getId(), List.of());
            BigDecimal revenue = BigDecimal.ZERO;
            long completedBookings = 0;
            for (Branch branch : branches) {
                revenue = revenue.add(revenueByBranch.getOrDefault(branch.getId(), BigDecimal.ZERO));
                completedBookings += completedByBranch.getOrDefault(branch.getId(), 0L);
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("restaurantId", restaurant.getId());
            row.put("restaurantName", restaurant.getRestaurantName());
            row.put("branchCount", branches.size());
            row.put("completedBookings", completedBookings);
            row.put("revenue", revenue);
            result.add(row);
        }
        result.sort((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")));
        return ResponseEntity.ok(result);
    }

    // ======================================================
    // F48: Thong ke luot dat ban theo ngay
    // ======================================================
    @GetMapping("/statistics/bookings-daily")
    public ResponseEntity<List<Map<String, Object>>> bookingsDaily(@RequestParam(defaultValue = "30") int days) {
        LocalDateTime from = LocalDateTime.now().minusDays(Math.max(days, 1));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : bookingRepository.countBookingsPerDaySince(from)) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", row[0].toString());
            point.put("count", row[1]);
            result.add(point);
        }
        return ResponseEntity.ok(result);
    }

    // ======================================================
    // F50: Xuat bao cao thong ke ra file CSV (mo duoc bang Excel)
    // ======================================================
    @GetMapping("/reports/export")
    public void exportReport(@RequestParam(defaultValue = "users") String type,
                              HttpServletResponse response) throws java.io.IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"dabana_" + type + "_report.csv\"");

        response.getOutputStream().write(0xEF);
        response.getOutputStream().write(0xBB);
        response.getOutputStream().write(0xBF);

        PrintWriter writer = response.getWriter();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        switch (type) {
            case "restaurants" -> {
                writer.println("ID,Ten nha hang,Trang thai,Ngay tao");
                for (Restaurant r : restaurantRepository.findAll()) {
                    writer.println(csvRow(r.getId(), r.getRestaurantName(), 
                            r.getApprovalStatus(), r.getCreatedAt() == null ? "" : r.getCreatedAt().format(fmt)));
                }
            }
            case "revenue" -> {
                writer.println("ID nha hang,Ten nha hang,So chi nhanh,Don hoan tat,Doanh thu (VND)");
                for (Map<String, Object> row : revenueByRestaurant().getBody()) {
                    writer.println(csvRow(row.get("restaurantId"), row.get("restaurantName"),
                            row.get("branchCount"), row.get("completedBookings"), row.get("revenue")));
                }
            }
            default -> {
                writer.println("ID,Ho ten,Email,SDT,Vai tro,Trang thai,Ngay tao");
                for (User u : userRepository.findAll()) {
                    String role = u.getUserRoles().stream().findFirst()
                            .map(ur -> ur.getRole().getName()).orElse("");
                    writer.println(csvRow(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(),
                            role, u.getStatus(), u.getCreatedAt() == null ? "" : u.getCreatedAt().format(fmt)));
                }
            }
        }
        writer.flush();
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
