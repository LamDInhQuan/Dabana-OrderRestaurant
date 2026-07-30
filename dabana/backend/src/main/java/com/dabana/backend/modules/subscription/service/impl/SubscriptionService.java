package com.dabana.backend.modules.subscription.service.impl;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.notification.NotificationService;
import com.dabana.backend.modules.notification.NotificationType;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.subscription.dto.request.ScheduleDowngradeRequest;
import com.dabana.backend.modules.subscription.dto.request.SubscribeInitialPlanRequest;
import com.dabana.backend.modules.subscription.dto.request.UpgradePlanRequest;
import com.dabana.backend.modules.subscription.dto.response.AdminSubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.dto.response.BranchLimitCheckResponse;
import com.dabana.backend.modules.subscription.dto.response.InvoicePaymentInfoResponse;
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
import com.dabana.backend.modules.subscription.service.SubscriptionPayosClientProvider;
import com.dabana.backend.modules.subscription.util.BillingCycleUtils;
import com.dabana.backend.modules.subscription.util.SubscriptionErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.exception.PayOSException;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
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
    private final SubscriptionPayosClientProvider payosClientProvider;

    private final RestaurantSubscriptionMapper subscriptionMapper;
    private final SubscriptionInvoiceMapper invoiceMapper;

    /**
     * Mac dinh tro ve trang Billing cua FE, dung {invoiceId} de thay the.
     * Nen override qua application.yml khi trien khai domain that:
     *   app:
     *     subscription:
     *       payment:
     *         return-url-template: https://dabana.dpdns.org/partner/billing?invoiceId={invoiceId}&status=success
     *         cancel-url-template: https://dabana.dpdns.org/partner/billing?invoiceId={invoiceId}&status=cancel
     */
    @Value("${app.subscription.payment.return-url-template:http://localhost:5173/partner/billing?invoiceId={invoiceId}&status=success}")
    private String returnUrlTemplate;

    @Value("${app.subscription.payment.cancel-url-template:http://localhost:5173/partner/billing?invoiceId={invoiceId}&status=cancel}")
    private String cancelUrlTemplate;

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
    // payOS - tao link thanh toan / xem thong tin thanh toan
    // ---------------------------------------------------------------------

    @Override
    public InvoicePaymentInfoResponse createPaymentLinkForInvoice(Long restaurantId, Long invoiceId) {
        SubscriptionInvoice invoice = getOwnedInvoiceOrThrow(restaurantId, invoiceId);

        if (invoice.getStatus() != InvoiceStatus.PENDING && invoice.getStatus() != InvoiceStatus.OVERDUE) {
            throw new BusinessException(SubscriptionErrorCode.INVOICE_NOT_PAYABLE);
        }

        // Da co link con hieu luc - tra ve link CU, KHONG goi payOS tao lai (orderCode = invoiceId,
        // khong the doi, goi create() lan 2 voi cung orderCode co the bi payOS tu choi).
        if (invoice.getCheckoutUrl() != null) {
            return toPaymentInfoResponse(invoice, null);
        }

        PayOS client = payosClientProvider.getClient();
        Long orderCode = invoice.getId();
        // payOS gioi han description TOI DA 25 KY TU - khong duoc ghep ten goi vao
        // (ten goi co the dai bat ky, se lam vuot gioi han va bi APIException tu choi).
        String description = "Phi DV #" + invoice.getId();
        String returnUrl = returnUrlTemplate.replace("{invoiceId}", String.valueOf(invoiceId));
        String cancelUrl = cancelUrlTemplate.replace("{invoiceId}", String.valueOf(invoiceId));

        CreatePaymentLinkRequest payload = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(invoice.getAmount().longValue())
                .description(description)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .build();

        CreatePaymentLinkResponse payosResponse;
        try {
            payosResponse = client.paymentRequests().create(payload);
        } catch (PayOSException e) {
            log.error("Tao link thanh toan payOS that bai cho invoiceId={}", invoiceId, e);
            throw new BusinessException(SubscriptionErrorCode.PAYOS_CREATE_PAYMENT_LINK_FAILED);
        }

        invoice.setCheckoutUrl(payosResponse.getCheckoutUrl());
        invoice.setQrCode(payosResponse.getQrCode());
        invoiceRepository.save(invoice);

        return toPaymentInfoResponse(invoice, null);
    }

    @Override
    @Transactional
    public InvoicePaymentInfoResponse getPaymentInfo(Long restaurantId, Long invoiceId) {
        SubscriptionInvoice invoice = getOwnedInvoiceOrThrow(restaurantId, invoiceId);

        if (invoice.getCheckoutUrl() == null) {
            throw new BusinessException(SubscriptionErrorCode.PAYMENT_LINK_NOT_FOUND);
        }

        PaymentLink liveInfo;
        try {
            liveInfo = payosClientProvider.getClient().paymentRequests().get(invoice.getId());
        } catch (PayOSException e) {
            log.error("Dong bo thong tin thanh toan tu payOS that bai cho invoiceId={}", invoiceId, e);
            throw new BusinessException(SubscriptionErrorCode.PAYOS_SYNC_PAYMENT_FAILED);
        }

        // Luoi an toan: neu payOS bao da PAID nhung webhook chua kip xu ly (cham tre/loi mang) thi
        // chu dong kich hoat luon o day, tranh nha hang thay "da thanh toan" tren payOS ma he thong
        // Dabana van hien PENDING.
        // getStatus() tra ve enum PaymentLinkStatus (khong phai String) - dung String.valueOf()
        // de so sanh an toan du SDK tra ve kieu gi.
        if ("PAID".equalsIgnoreCase(String.valueOf(liveInfo.getStatus()))
                && (invoice.getStatus() == InvoiceStatus.PENDING || invoice.getStatus() == InvoiceStatus.OVERDUE)) {
            markInvoicePaidManually(invoiceId);
            invoice = invoiceRepository.findById(invoiceId).orElse(invoice);
        }

        return toPaymentInfoResponse(invoice, liveInfo);
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
        invoice = invoiceRepository.save(invoice);

        notificationService.sendImmediate(
                subscription.getRestaurant().getOwner(),
                NotificationType.SUB_REGISTERED,
                "Bạn đã đăng ký thành công gói " + plan.getName() + ". Vui lòng thanh toán để kích hoạt.",
                "IN_APP", null);

        return invoiceMapper.toResponse(invoice);
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
                NotificationType.SUB_PAY_CONFIRMED,
                "Thanh toán hoá đơn gói " + invoice.getPlanSnapshotName() + " thành công.",
                "IN_APP", null);

        // Doi soat lai han muc chi nhanh SAU MOI lan xac nhan thanh toan (khong chi rieng truong hop
        // EXPIRED) - vi ha cap xuong goi co han muc thap hon so chi nhanh dang co CUNG can xu ly y het,
        // chu khong chi mien "vua het han quay lai".
        //
        // QUAN TRONG: boc try-catch rieng o day - day la tinh nang PHU (tam ngung/khoi phuc chi nhanh),
        // TUYET DOI khong duoc de loi o day lam rollback mat luon viec xac nhan thanh toan (INVOICE da
        // PAID, subscription da ACTIVE o tren) - neu loi thi log lai de xu ly thu cong sau, khong throw.
        try {
            reconcileBranchLimitAfterPlanChange(subscription);
        } catch (Exception e) {
            log.error("Doi soat han muc chi nhanh that bai sau khi xac nhan thanh toan invoiceId={} "
                    + "(thanh toan VAN DA duoc ghi nhan thanh cong, chi phan tam ngung/khoi phuc chi nhanh "
                    + "can kiem tra thu cong)", invoice.getId(), e);
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

    /** Tim hoa don theo id VA xac minh dung la thuoc ve restaurant nay (khong lo IDOR). */
    private SubscriptionInvoice getOwnedInvoiceOrThrow(Long restaurantId, Long invoiceId) {
        SubscriptionInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.INVOICE_NOT_FOUND));
        if (!invoice.getSubscription().getRestaurant().getId().equals(restaurantId)) {
            // Co tinh KHONG dung ma loi rieng "khong co quyen" - tra ve y het loi "khong tim thay"
            // de khong lo cho ke tan cong biet invoiceId nay co ton tai hay khong (giong thong le IDOR).
            throw new BusinessException(SubscriptionErrorCode.INVOICE_NOT_FOUND);
        }
        return invoice;
    }

    /**
     * @param liveInfo null neu chi vua tao link (chua can goi song payOS lay lai ngay).
     *
     * LUU Y: gia dinh PaymentLink.getAmountPaid()/getAmountRemaining() tra ve kieu Long
     * (nullable, giong cach DepositPaymentService da ghi chu san). Neu ban doi chieu
     * javadoc.io/doc/vn.payos/payos-java thay day la kieu long (primitive) thi bo dieu
     * kien "!= null" va goi BigDecimal.valueOf(...) truc tiep.
     */
    private InvoicePaymentInfoResponse toPaymentInfoResponse(SubscriptionInvoice invoice, PaymentLink liveInfo) {
        return InvoicePaymentInfoResponse.builder()
                .invoiceId(invoice.getId())
                .orderCode(invoice.getId())
                .amount(invoice.getAmount())
                .amountPaid(liveInfo != null && liveInfo.getAmountPaid() != null
                        ? java.math.BigDecimal.valueOf(liveInfo.getAmountPaid()) : null)
                .amountRemaining(liveInfo != null && liveInfo.getAmountRemaining() != null
                        ? java.math.BigDecimal.valueOf(liveInfo.getAmountRemaining()) : null)
                .payosStatus(liveInfo != null ? String.valueOf(liveInfo.getStatus()) : null)
                .checkoutUrl(invoice.getCheckoutUrl())
                .qrCode(invoice.getQrCode())
                .invoiceStatus(invoice.getStatus())
                .build();
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
     * Doi soat lai han muc chi nhanh sau MOI lan snapshot cua subscription thay doi
     * (ap dung hoa don da thanh toan - INITIAL/RENEWAL/UPGRADE deu goi qua day).
     * Xu ly CA 2 CHIEU trong cung 1 lan:
     *
     *   1) Khoi phuc chi nhanh dang bi tam ngung (du ly do la EXPIRED truoc do hay
     *      DA TUNG bi tam ngung vi ha cap) - uu tien khoi phuc chi nhanh bi ngung
     *      SAU CUNG truoc, cho den khi dat han muc moi.
     *   2) Neu sau buoc 1 van CON VUOT han muc (truong hop ha cap xuong thap hon
     *      so chi nhanh dang hoat dong that su) - tam ngung bot chi nhanh, uu tien
     *      tam ngung chi nhanh TAO GAN NHAT truoc (dung BR03 da quy dinh o B18),
     *      ghi log voi ly do rieng de phan biet voi truong hop EXPIRED.
     *
     * Truoc day ham nay (ten cu: restoreBranchesUpToLimit) CHI xu ly chieu (1) va
     * CHI goi khi subscription vua tu EXPIRED chuyen ve - bo sot hoan toan truong
     * hop ha cap lam vuot han muc chi nhanh dang hoat dong.
     */
    private void    reconcileBranchLimitAfterPlanChange(RestaurantSubscription subscription) {
        Long restaurantId = subscription.getRestaurant().getId();
        List<Branch> allBranches = branchRepository.findByRestaurantId(restaurantId);
        int maxBranches = subscription.getMaxBranchesSnapshot();

        // ---- Chieu 1: khoi phuc chi nhanh dang tam ngung, neu con cho trong ----
        long activeCount = allBranches.stream()
                .filter(b -> !BranchStatus.SUSPENDED.getStatus().equals(b.getStatus()))
                .count();
        long slotsToRestore = maxBranches - activeCount;

        if (slotsToRestore > 0) {
            List<BranchSuspension> suspendedBranches = branchSuspensionRepository
                    .findBySubscription_IdAndStatusOrderBySuspendedAtDesc(subscription.getId(), SuspensionStatus.ACTIVE);

            int restored = 0;
            for (BranchSuspension suspension : suspendedBranches) {
                if (restored >= slotsToRestore) break;
                Branch branch = suspension.getBranch();
                branch.setStatus(BranchStatus.ACTIVE.getStatus());
                branchRepository.save(branch);

                suspension.setStatus(SuspensionStatus.RESTORED);
                suspension.setRestoredAt(LocalDateTime.now());
                branchSuspensionRepository.save(suspension);
                restored++;
            }
        }

        // ---- Chieu 2: neu VAN CON vuot han muc (truong hop ha cap) - tam ngung bot ----
        // Dung Comparator.nullsFirst de tranh NPE neu co branch nao bi thieu createdAt (du hiem,
        // vi du du lieu cu tao truoc khi bat JPA Auditing) - branch thieu createdAt se bi coi la
        // "cu nhat", uu tien GIU LAI thay vi tam ngung nham.
        List<Branch> stillActiveBranches = branchRepository.findByRestaurantId(restaurantId).stream()
                .filter(b -> !BranchStatus.SUSPENDED.getStatus().equals(b.getStatus()))
                .sorted(Comparator.comparing(Branch::getCreatedAt,
                        Comparator.nullsFirst(Comparator.naturalOrder())).reversed())
                .toList();

        long overLimitCount = stillActiveBranches.size() - maxBranches;
        if (overLimitCount <= 0) {
            return;
        }

        stillActiveBranches.stream()
                .limit(overLimitCount)
                .forEach(branch -> {
                    branch.setStatus(BranchStatus.SUSPENDED.getStatus());
                    branchRepository.save(branch);

                    BranchSuspension suspension = new BranchSuspension();
                    suspension.setBranch(branch);
                    suspension.setSubscription(subscription);
                    suspension.setReason("OVER_BRANCH_LIMIT_AFTER_DOWNGRADE");
                    branchSuspensionRepository.save(suspension);
                });

        notificationService.sendImmediate(
                subscription.getRestaurant().getOwner(),
                NotificationType.SUB_DOWN_SUSPEND,
                "Gói dịch vụ vừa chuyển sang hạn mức " + maxBranches + " chi nhánh, thấp hơn số chi nhánh "
                        + "đang hoạt động. Hệ thống đã tự động tạm ngưng " + overLimitCount
                        + " chi nhánh tạo gần đây nhất.",
                "IN_APP", null);
    }
}