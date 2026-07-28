package com.dabana.backend.modules.subscription.scheduler;

import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchStatus;
import com.dabana.backend.modules.notification.NotificationService;
import com.dabana.backend.modules.subscription.entity.BranchSuspension;
import com.dabana.backend.modules.subscription.entity.RestaurantSubscription;
import com.dabana.backend.modules.subscription.entity.SubscriptionInvoice;
import com.dabana.backend.modules.subscription.entity.SubscriptionPlan;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.enums.InvoiceType;
import com.dabana.backend.modules.subscription.enums.SubscriptionStatus;
import com.dabana.backend.modules.subscription.repository.BranchSuspensionRepository;
import com.dabana.backend.modules.subscription.repository.RestaurantSubscriptionRepository;
import com.dabana.backend.modules.subscription.repository.SubscriptionInvoiceRepository;
import com.dabana.backend.modules.subscription.repository.SubscriptionPlanRepository;
import com.dabana.backend.modules.subscription.service.ISubscriptionService;
import com.dabana.backend.modules.subscription.util.BillingCycleUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/**
 * Cron job hang ngay xu ly vong doi thanh toan cua subscription:
 * - phat hanh hoa don gia han truoc han
 * - chuyen PAST_DUE khi qua due_date (bat dau an han)
 * - chuyen EXPIRED + tam ngung chi nhanh vuot han muc khi het thoi gian an han
 *
 * CHUA tich hop payOS: job phat hanh hoa don gia han hien chi tao ban ghi
 * SubscriptionInvoice (PENDING), CHUA tu dong sinh link thanh toan. Admin can
 * dung API xac nhan thanh toan thu cong (hoac cho payOS wiring sau nay).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionBillingScheduler {

    /** So ngay truoc current_period_end se phat hanh hoa don gia han. */
    @Value("${dabana.subscription.renewal-lead-days:3}")
    private int renewalLeadDays;

    /** So ngay an han sau due_date truoc khi chuyen EXPIRED. */
    @Value("${dabana.subscription.grace-period-days:3}")
    private int gracePeriodDays;

    /**
     * Han muc chi nhanh toi thieu ap dung tam thoi khi subscription EXPIRED, dung de
     * tinh so chi nhanh can tam ngung. Mac dinh 0 - tam ngung het cho den khi nha
     * hang thanh toan lai.
     */
    @Value("${dabana.subscription.max-branches-on-expiry:0}")
    private int maxBranchesOnExpiry;

    private final RestaurantSubscriptionRepository subscriptionRepository;
    private final SubscriptionInvoiceRepository invoiceRepository;
    private final SubscriptionPlanRepository planRepository;
    private final BranchRepository branchRepository;
    private final BranchSuspensionRepository branchSuspensionRepository;
    private final NotificationService notificationService;
    private final ISubscriptionService subscriptionService;

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void generateRenewalInvoices() {
        LocalDate targetPeriodEnd = LocalDate.now().plusDays(renewalLeadDays);

        List<RestaurantSubscription> dueForRenewal = subscriptionRepository
                .findByStatusAndAutoRenewTrueAndCurrentPeriodEnd(SubscriptionStatus.ACTIVE, targetPeriodEnd);

        for (RestaurantSubscription subscription : dueForRenewal) {
            LocalDate expectedRenewalPeriodStart = subscription.getCurrentPeriodEnd().plusDays(1);

            boolean alreadyHasRenewalInvoice = invoiceRepository
                    .findFirstBySubscription_IdOrderByCreatedAtDesc(subscription.getId())
                    .filter(inv -> inv.getInvoiceType() == InvoiceType.RENEWAL
                            && inv.getPeriodStart().equals(expectedRenewalPeriodStart))
                    .isPresent();
            if (alreadyHasRenewalInvoice) {
                continue;
            }

            // Neu co lich ha cap dang cho, dung goi do de tinh hoa don gia han; nguoc lai dung goi hien tai.
            SubscriptionPlan planToRenew = subscription.getPendingDowngradePlan() != null
                    ? subscription.getPendingDowngradePlan()
                    : subscription.getPlan();

            LocalDate periodEnd = BillingCycleUtils.addOneCycle(expectedRenewalPeriodStart, planToRenew.getBillingCycle());

            SubscriptionInvoice invoice = new SubscriptionInvoice();
            invoice.setSubscription(subscription);
            invoice.setPlan(planToRenew);
            invoice.setInvoiceType(InvoiceType.RENEWAL);
            invoice.setPlanSnapshotName(planToRenew.getName());
            invoice.setAmount(planToRenew.getPrice());
            invoice.setMaxBranchesSnapshot(planToRenew.getMaxBranches());
            invoice.setPeriodStart(expectedRenewalPeriodStart);
            invoice.setPeriodEnd(periodEnd);
            invoice.setDueDate(subscription.getCurrentPeriodEnd());
            invoice.setStatus(InvoiceStatus.PENDING);
            invoice = invoiceRepository.save(invoice);

            // Tu dong tao link thanh toan ngay (khac voi INITIAL/UPGRADE - nha hang chu dong bam
            // dang ky/nang cap nen tao link ngay luc do; con RENEWAL phat sinh tu cron nen can co
            // san link truoc de gui kem trong thong bao, khong bat nha hang phai vao app roi moi tao).
            try {
                subscriptionService.createPaymentLinkForInvoice(subscription.getRestaurant().getId(), invoice.getId());
            } catch (Exception e) {
                log.error("Khong the tu dong tao link thanh toan cho hoa don gia han invoiceId={}",
                        invoice.getId(), e);
            }

            notificationService.sendImmediate(
                    subscription.getRestaurant().getOwner(),
                    "SUBSCRIPTION_RENEWAL_DUE",
                    "Hoa don gia han goi " + planToRenew.getName() + " da duoc tao, han thanh toan "
                            + subscription.getCurrentPeriodEnd() + ".",
                    "IN_APP");
        }
    }

    @Scheduled(cron = "0 30 1 * * *")
    @Transactional
    public void markOverdueAndStartGracePeriod() {
        List<SubscriptionInvoice> overdueInvoices = invoiceRepository
                .findByStatusAndDueDateBefore(InvoiceStatus.PENDING, LocalDate.now());

        for (SubscriptionInvoice invoice : overdueInvoices) {
            if (invoice.getInvoiceType() == InvoiceType.UPGRADE) {
                // Hoa don UPGRADE qua han khong anh huong subscription dang ACTIVE (van dung goi cu) -
                // chi huy hoa don, nha hang co the thu nang cap lai sau.
                invoice.setStatus(InvoiceStatus.CANCELLED);
                invoiceRepository.save(invoice);
                continue;
            }

            invoice.setStatus(InvoiceStatus.OVERDUE);
            invoiceRepository.save(invoice);

            RestaurantSubscription subscription = invoice.getSubscription();
            if (subscription.getStatus() == SubscriptionStatus.ACTIVE
                    || subscription.getStatus() == SubscriptionStatus.PENDING_PAYMENT) {
                subscription.setStatus(SubscriptionStatus.PAST_DUE);
                subscription.setGracePeriodEnd(invoice.getDueDate().plusDays(gracePeriodDays));
                subscriptionRepository.save(subscription);

                notificationService.sendImmediate(
                        subscription.getRestaurant().getOwner(),
                        "SUBSCRIPTION_PAST_DUE",
                        "Hoa don goi " + invoice.getPlanSnapshotName() + " da qua han thanh toan. "
                                + "Vui long thanh toan truoc " + subscription.getGracePeriodEnd()
                                + " de tranh bi tam ngung chi nhanh.",
                        "IN_APP");
            }
        }
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void expireAndSuspendOverLimitBranches() {
        List<RestaurantSubscription> pastDueExpired = subscriptionRepository
                .findByStatusAndGracePeriodEndBefore(SubscriptionStatus.PAST_DUE, LocalDate.now());

        for (RestaurantSubscription subscription : pastDueExpired) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);

            List<Long> suspendedBranchIds = suspendBranchesOverLimit(subscription);

            notificationService.sendImmediate(
                    subscription.getRestaurant().getOwner(),
                    "SUBSCRIPTION_EXPIRED_BRANCH_SUSPENDED",
                    "Goi dich vu da het han qua thoi gian an han. Da tam ngung " + suspendedBranchIds.size()
                            + " chi nhanh (id: " + suspendedBranchIds + "). Thanh toan lai de khoi phuc.",
                    "IN_APP");
        }
    }

    /**
     * Xac dinh va tam ngung dung so chi nhanh vuot han muc toi thieu, uu tien
     * chi nhanh TAO GAN NHAT bi tam ngung TRUOC.
     */
    private List<Long> suspendBranchesOverLimit(RestaurantSubscription subscription) {
        List<Branch> branches = branchRepository.findByRestaurantId(subscription.getRestaurant().getId()).stream()
                .sorted(Comparator.comparing(Branch::getCreatedAt).reversed())
                .toList();

        long overLimitCount = branches.size() - maxBranchesOnExpiry;
        if (overLimitCount <= 0) {
            return List.of();
        }

        return branches.stream()
                .limit(overLimitCount)
                .map(branch -> {
                    branch.setStatus(BranchStatus.SUSPENDED.getStatus());
                    branchRepository.save(branch);

                    BranchSuspension suspension = new BranchSuspension();
                    suspension.setBranch(branch);
                    suspension.setSubscription(subscription);
                    suspension.setReason("OVER_BRANCH_LIMIT_AFTER_EXPIRY");
                    branchSuspensionRepository.save(suspension);

                    return branch.getId();
                })
                .toList();
    }
}
