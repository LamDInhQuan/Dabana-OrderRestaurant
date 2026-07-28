package com.dabana.backend.modules.subscription.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.BaseController;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.subscription.dto.request.ScheduleDowngradeRequest;
import com.dabana.backend.modules.subscription.dto.request.SubscribeInitialPlanRequest;
import com.dabana.backend.modules.subscription.dto.request.UpgradePlanRequest;
import com.dabana.backend.modules.subscription.dto.response.BranchLimitCheckResponse;
import com.dabana.backend.modules.subscription.dto.response.InvoicePaymentInfoResponse;
import com.dabana.backend.modules.subscription.dto.response.RestaurantSubscriptionResponse;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.service.ISubscriptionService;
import com.dabana.backend.modules.subscription.util.SubscriptionErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * /api/subscriptions/me - tu quan ly goi dich vu cua CHINH nha hang dang dang nhap.
 * Theo dung quy uoc "/me" da co san trong he thong (vi du /api/restaurants/me,
 * /api/branchs/me) - restaurantId LUON duoc suy ra tu JWT, khong nhan qua path/param
 * de tranh IDOR (khong ai sua duoc subscription cua nha hang khac).
 *
 * Phan quyen: SecurityConfig can them rule
 *   .requestMatchers("/api/subscriptions/me/**").hasRole("RESTAURANT_PARTNER")
 * (xem file diff rieng kem theo).
 */
@RestController
@RequestMapping("/api/subscriptions/me")
@RequiredArgsConstructor
public class RestaurantSubscriptionController extends BaseController {

    private final ISubscriptionService subscriptionService;
    private final RestaurantRepository restaurantRepository;

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<RestaurantSubscriptionResponse>> getCurrentSubscription() {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.getCurrentSubscription(restaurantId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionInvoiceResponse>> subscribeInitialPlan(
            @Valid @RequestBody SubscribeInitialPlanRequest request
    ) {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED,
                subscriptionService.subscribeInitialPlan(restaurantId, request)));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<ApiResponse<SubscriptionInvoiceResponse>> upgradePlan(
            @Valid @RequestBody UpgradePlanRequest request
    ) {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.upgradePlan(restaurantId, request)));
    }

    @PostMapping("/schedule-downgrade")
    public ResponseEntity<ApiResponse<RestaurantSubscriptionResponse>> scheduleDowngrade(
            @Valid @RequestBody ScheduleDowngradeRequest request
    ) {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.scheduleDowngrade(restaurantId, request)));
    }

    @DeleteMapping("/schedule-downgrade")
    public ResponseEntity<ApiResponse<RestaurantSubscriptionResponse>> cancelScheduledDowngrade() {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.cancelScheduledDowngrade(restaurantId)));
    }

    /**
     * FE goi truoc khi hien form them chi nhanh de canh bao som. Luu y: day CHI
     * la UX ho tro - BranchService van tu kiem tra lai o tang server (xem diff
     * BranchService.java), khong duoc bo qua goi API tao chi nhanh that.
     */
    @GetMapping("/branch-limit-check")
    public ResponseEntity<ApiResponse<BranchLimitCheckResponse>> checkBranchLimit() {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.checkBranchLimit(restaurantId)));
    }

    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<SubscriptionInvoiceResponse>>> listInvoices() {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.listInvoices(restaurantId)));
    }

    /**
     * Tao link thanh toan payOS cho 1 hoa don cua chinh nha hang. Neu da co link
     * con hieu luc, tra ve link CU (idempotent) - khop dung buoc "create-link"
     * trong luong dat coc (paymentApi.createPaymentLink).
     */
    @PostMapping("/invoices/{invoiceId}/payment-link")
    public ResponseEntity<ApiResponse<InvoicePaymentInfoResponse>> createPaymentLink(@PathVariable Long invoiceId) {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED,
                subscriptionService.createPaymentLinkForInvoice(restaurantId, invoiceId)));
    }

    /**
     * Xem thong tin thanh toan hien tai (dong bo song voi payOS). Nem loi
     * PAYMENT_LINK_NOT_FOUND neu hoa don chua tung tao link - FE catch loi nay
     * va tu goi sang createPaymentLink, khop dung buoc "info" trong luong dat coc
     * (paymentApi.getDetail tra 400 PAYMENT_NOT_FOUND khi chua co).
     */
    @GetMapping("/invoices/{invoiceId}/payment")
    public ResponseEntity<ApiResponse<InvoicePaymentInfoResponse>> getPaymentInfo(@PathVariable Long invoiceId) {
        Long restaurantId = resolveCurrentRestaurantId();
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                subscriptionService.getPaymentInfo(restaurantId, invoiceId)));
    }

    private Long resolveCurrentRestaurantId() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("Khong tim thay nguoi dung hien tai");
        }
        return restaurantRepository.findByOwnerUserId(currentUser.getId())
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.RESTAURANT_NOT_FOUND))
                .getId();
    }
}
