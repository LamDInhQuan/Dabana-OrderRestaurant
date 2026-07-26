package com.dabana.backend.modules.subscription.service.impl;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.notification.NotificationService;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.subscription.dto.request.ScheduleDowngradeRequest;
import com.dabana.backend.modules.subscription.dto.request.SubscribeInitialPlanRequest;
import com.dabana.backend.modules.subscription.dto.request.UpgradePlanRequest;
import com.dabana.backend.modules.subscription.dto.response.AdminSubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.dto.response.BranchLimitCheckResponse;
import com.dabana.backend.modules.subscription.dto.response.RestaurantSubscriptionResponse;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.entity.BranchSuspension;
import com.dabana.backend.modules.subscription.entity.RestaurantSubscription;
import com.dabana.backend.modules.subscription.entity.SubscriptionInvoice;
import com.dabana.backend.modules.subscription.entity.SubscriptionPlan;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.enums.InvoiceType;
import com.dabana.backend.modules.subscription.enums.PlanStatus;
import com.dabana.backend.modules.subscription.enums.SubscriptionStatus;
import com.dabana.backend.modules.subscription.enums.SuspensionStatus;
import com.dabana.backend.modules.subscription.mapper.RestaurantSubscriptionMapper;
import com.dabana.backend.modules.subscription.mapper.SubscriptionInvoiceMapper;
import com.dabana.backend.modules.subscription.repository.BranchSuspensionRepository;
import com.dabana.backend.modules.subscription.repository.RestaurantSubscriptionRepository;
import com.dabana.backend.modules.subscription.repository.SubscriptionInvoiceRepository;
import com.dabana.backend.modules.subscription.repository.SubscriptionPlanRepository;
import com.dabana.backend.modules.subscription.service.ISubscriptionService;
import com.dabana.backend.modules.subscription.util.BillingCycleUtils;
import com.dabana.backend.modules.subscription.util.SubscriptionErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService implements ISubscriptionService {

    /** Trang thai duoc coi la "dang hieu luc" khi tim subscription hien tai cua 1 restaurant. */
    private static final List<SubscriptionStatus> LIVE_STATUSES =
            List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE);

    private final SubscriptionPlanRepository planRepository;
    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final SubscriptionInvoiceRepository invoiceRepository;
    private final BranchSuspensionRepository branchSuspensionRepository;

    private final RestaurantRepository restaurantRepository;
    private final BranchRepository branchRepository;
    private final NotificationService notificationService;

    private final RestaurantSubscriptionMapper subscriptionMapper;
    private final SubscriptionInvoiceMapper invoiceMapper;

    // ---------------------------------------------------------------------
    // Doc du lieu
    // ---------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public RestaurantSubscriptionResponse getCurrentSubscription(Long restaurantId) {
        return subscriptionMapper.toResponse(getLiveSubscriptionOrThrow(restaurantId));
    }

    @Override
    @Transactional(readOnly = true)
    public BranchLimitCheckResponse checkBranchLimit(Long restaurantId) {
        return subscriptionRepository
                .findFirstByRestaurant_IdAndStatusInOrderByCreatedAtDesc(restaurantId, LIVE_STATUSES)
                .map(sub -> {
                    long currentCount = branchRepository.findByRestaurantId(restaurantId).size();
                    boolean allowed = currentCount < sub.getMaxBranchesSnapshot();
                    String message = allowed
                            ? "Còn được thêm chi nhánh"
                            : "Đã đạt giới hạn " + sub.getMaxBranchesSnapshot()
                              + " chi nhánh của gói " + sub.getPlanNameSnapshot()
                              + ". Vui lòng nâng cấp gói để thêm chi nhánh.";
                    return BranchLimitCheckResponse.builder()
                            .allowed(allowed)
                            .currentBranchCount(currentCount)
                            .maxBranchesSnapshot(sub.getMaxBranchesSnapshot())
                            .message(message)
                            .build();
                })
                .orElseGet(() -> BranchLimitCheckResponse.builder()
                        .allowed(false)
                        .currentBranchCount(0)
                        .maxBranchesSnapshot(0)
                        .message("Nhà hàng chưa có gói dịch vụ đang hoạt động")
                        .build());
    }

    @Override
    @Transactional(readOnly = true)
    public void assertCanAddBranch(Long restaurantId) {
        RestaurantSubscription subscription = getLiveSubscriptionOrThrow(restaurantId);
        long currentCount = branchRepository.findByRestaurantId(restaurantId).size();
        if (currentCount >= subscription.getMaxBranchesSnapshot()) {
            throw new BusinessException(SubscriptionErrorCode.BRANCH_LIMIT_EXCEEDED);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionInvoiceResponse> listInvoices(Long restaurantId) {
        return invoiceRepository.findBySubscription_Restaurant_IdOrderByCreatedAtDesc(restaurantId).stream()
                .map(invoiceMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminSubscriptionInvoiceResponse> listInvoicesForAdmin(List<InvoiceStatus> statuses) {
        List<SubscriptionInvoice> invoices = (statuses == null || statuses.isEmpty())
                ? invoiceRepository.findAllByOrderByCreatedAtDesc()
                : invoiceRepository.findByStatusInOrderByCreatedAtDesc(statuses);
        return invoices.stream()
                .map(invoiceMapper::toAdminResponse)
                .toList();
    }

    // ---------------------------------------------------------------------
    // Dang ky / nang cap / ha cap
    // ---------------------------------------------------------------------

    @Override
    public SubscriptionInvoiceResponse subscribeInitialPlan(Long restaurantId, SubscribeInitialPlanRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.RESTAURANT_NOT_FOUND));

        subscriptionRepository
                .findFirstByRestaurant_IdAndStatusInOrderByCreatedAtDesc(restaurantId, List.of(
                        SubscriptionStatus.PENDING_PAYMENT, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE))
                .ifPresent(existing -> {
                    throw new BusinessException(SubscriptionErrorCode.DUPLICATE_SUBSCRIPTION);
                });

        SubscriptionPlan plan = getActivePlanOrThrow(request.getPlanId());

        LocalDate today = LocalDate.now();
        LocalDate periodEnd = BillingCycleUtils.addOneCycle(today, plan.getBillingCycle());

        RestaurantSubscription subscription = new RestaurantSubscription();
        subscription.setRestaurant(restaurant);
        subscription.setPlan(plan);
        subscription.setPlanNameSnapshot(plan.getName());
        subscription.setPriceSnapshot(plan.getPrice());
        subscription.setBillingCycleSnapshot(plan.getBillingCycle());
        subscription.setMaxBranchesSnapshot(plan.getMaxBranches());
        subscription.setStatus(SubscriptionStatus.PENDING_PAYMENT);
        subscription.setCurrentPeriodStart(today);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setAutoRenew(true);
        subscription = subscriptionRepository.save(subscription);

        SubscriptionInvoice invoice = buildInvoice(subscription, plan, InvoiceType.INITIAL, today, periodEnd);
        return invoiceMapper.toResponse(invoiceRepository.save(invoice));
    }

    @Override
    public SubscriptionInvoiceResponse upgradePlan(Long restaurantId, UpgradePlanRequest request) {
        RestaurantSubscription subscription = getLiveSubscriptionOrThrow(restaurantId);
        SubscriptionPlan currentPlan = subscription.getPlan();
        SubscriptionPlan targetPlan = getActivePlanOrThrow(request.getNewPlanId());

        if (targetPlan.getDisplayOrder() <= currentPlan.getDisplayOrder()) {
            throw new BusinessException(SubscriptionErrorCode.INVALID_PLAN_CHANGE);
        }

        LocalDate today = LocalDate.now();
        LocalDate periodEnd = BillingCycleUtils.addOneCycle(today, targetPlan.getBillingCycle());

        // Khong proration: thu du gia goi moi, chu ky tinh lai tu hom nay.
        SubscriptionInvoice invoice = buildInvoice(subscription, targetPlan, InvoiceType.UPGRADE, today, periodEnd);
        return invoiceMapper.toResponse(invoiceRepository.save(invoice));
    }

    @Override
    public RestaurantSubscriptionResponse scheduleDowngrade(Long restaurantId, ScheduleDowngradeRequest request) {
        RestaurantSubscription subscription = getLiveSubscriptionOrThrow(restaurantId);
        SubscriptionPlan currentPlan = subscription.getPlan();
        SubscriptionPlan targetPlan = getActivePlanOrThrow(request.getNewPlanId());

        if (targetPlan.getDisplayOrder() >= currentPlan.getDisplayOrder()) {
            throw new BusinessException(SubscriptionErrorCode.INVALID_PLAN_CHANGE);
        }

        // Khong doi snapshot ngay - chi ap dung vao ky gia han tiep theo (xem scheduler).
        subscription.setPendingDowngradePlan(targetPlan);
        return subscriptionMapper.toResponse(subscriptionRepository.save(subscription));
    }

    @Override
    public RestaurantSubscriptionResponse cancelScheduledDowngrade(Long restaurantId) {
        RestaurantSubscription subscription = getLiveSubscriptionOrThrow(restaurantId);
        subscription.setPendingDowngradePlan(null);
        return subscriptionMapper.toResponse(subscriptionRepository.save(subscription));
    }

    // ---------------------------------------------------------------------
    // Xac nhan thanh toan (TAM THOI: thu cong qua Admin, chua co payOS)
    // ---------------------------------------------------------------------

    @Override
    public void markInvoicePaidManually(Long invoiceId) {
        SubscriptionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.INVOICE_NOT_FOUND));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            return; // idempotent - tranh loi neu Admin bam xac nhan 2 lan
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BusinessException(SubscriptionErrorCode.INVOICE_ALREADY_CANCELLED);
        }

        LocalDateTime now = LocalDateTime.now();
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(now);
        invoiceRepository.save(invoice);

        RestaurantSubscription subscription = invoice.getSubscription();
        boolean wasExpired = subscription.getStatus() == SubscriptionStatus.EXPIRED;

        // Ap dung dung snapshot cua HOA DON (khong doc lai SubscriptionPlan hien hanh).
        subscription.setPlan(invoice.getPlan());
        subscription.setPlanNameSnapshot(invoice.getPlanSnapshotName());
        subscription.setPriceSnapshot(invoice.getAmount());
        subscription.setMaxBranchesSnapshot(invoice.getMaxBranchesSnapshot());
        // billingCycleSnapshot khong luu rieng trong hoa don - lay tu Plan tuong ung de dam bao nhat quan.
        subscription.setBillingCycleSnapshot(invoice.getPlan().getBillingCycle());
        subscription.setCurrentPeriodStart(invoice.getPeriodStart());
        subscription.setCurrentPeriodEnd(invoice.getPeriodEnd());
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setGracePeriodEnd(null);

        if (invoice.getInvoiceType() == InvoiceType.RENEWAL) {
            // Da ap dung xong goi da dat lich ha cap (neu co) - xoa lich cho.
            subscription.setPendingDowngradePlan(null);
        }
        subscriptionRepository.save(subscription);

        notificationService.sendImmediate(
                subscription.getRestaurant().getOwner(),
                "SUBSCRIPTION_PAYMENT_CONFIRMED",
                "Thanh toan hoa don goi " + invoice.getPlanSnapshotName() + " thanh cong.",
                "IN_APP");

        if (wasExpired) {
            restoreBranchesUpToLimit(subscription);
        }
    }

    // ---------------------------------------------------------------------
    // Ho tro noi bo
    // ---------------------------------------------------------------------

    private RestaurantSubscription getLiveSubscriptionOrThrow(Long restaurantId) {
        return subscriptionRepository
                .findFirstByRestaurant_IdAndStatusInOrderByCreatedAtDesc(restaurantId, LIVE_STATUSES)
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.SUBSCRIPTION_NOT_FOUND));
    }

    private SubscriptionPlan getActivePlanOrThrow(Long planId) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.PLAN_NOT_FOUND));
        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new BusinessException(SubscriptionErrorCode.PLAN_INACTIVE);
        }
        return plan;
    }

    private SubscriptionInvoice buildInvoice(RestaurantSubscription subscription, SubscriptionPlan plan,
                                              InvoiceType type, LocalDate periodStart, LocalDate periodEnd) {
        SubscriptionInvoice invoice = new SubscriptionInvoice();
        invoice.setSubscription(subscription);
        invoice.setPlan(plan);
        invoice.setInvoiceType(type);
        invoice.setPlanSnapshotName(plan.getName());
        invoice.setAmount(plan.getPrice());
        invoice.setMaxBranchesSnapshot(plan.getMaxBranches());
        invoice.setPeriodStart(periodStart);
        invoice.setPeriodEnd(periodEnd);
        invoice.setDueDate(LocalDate.now());
        invoice.setStatus(InvoiceStatus.PENDING);
        return invoice;
    }

    /**
     * Khoi phuc chi nhanh da bi tam ngung do thieu phi, theo thu tu NGUOC LAI
     * (chi nhanh bi ngung SAU CUNG duoc khoi phuc TRUOC), cho den khi dat han muc moi.
     * Chi goi tu markInvoicePaidManually khi subscription vua chuyen tu EXPIRED sang ACTIVE.
     */
    private void restoreBranchesUpToLimit(RestaurantSubscription subscription) {
        Long restaurantId = subscription.getRestaurant().getId();
        List<Branch> allBranches = branchRepository.findByRestaurantId(restaurantId);

        long currentActiveCount = allBranches.stream()
                .filter(b -> !BranchStatus.SUSPENDED.getStatus().equals(b.getStatus()))
                .count();
        long slotsAvailable = subscription.getMaxBranchesSnapshot() - currentActiveCount;
        if (slotsAvailable <= 0) {
            return;
        }

        List<BranchSuspension> suspendedBranches = branchSuspensionRepository
                .findBySubscription_IdAndStatusOrderBySuspendedAtDesc(subscription.getId(), SuspensionStatus.ACTIVE);

        int restored = 0;
        for (BranchSuspension suspension : suspendedBranches) {
            if (restored >= slotsAvailable) {
                break;
            }
            Branch branch = suspension.getBranch();
            branch.setStatus(BranchStatus.ACTIVE.getStatus());
            branchRepository.save(branch);

            suspension.setStatus(SuspensionStatus.RESTORED);
            suspension.setRestoredAt(LocalDateTime.now());
            branchSuspensionRepository.save(suspension);
            restored++;
        }
    }
}