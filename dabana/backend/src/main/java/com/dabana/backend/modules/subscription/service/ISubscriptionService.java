package com.dabana.backend.modules.subscription.service;

import com.dabana.backend.modules.subscription.dto.request.ScheduleDowngradeRequest;
import com.dabana.backend.modules.subscription.dto.request.SubscribeInitialPlanRequest;
import com.dabana.backend.modules.subscription.dto.request.UpgradePlanRequest;
import com.dabana.backend.modules.subscription.dto.response.AdminSubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.dto.response.BranchLimitCheckResponse;
import com.dabana.backend.modules.subscription.dto.response.RestaurantSubscriptionResponse;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;

import java.util.List;

public interface ISubscriptionService {

    /** Xem subscription dang hieu luc (ACTIVE/PAST_DUE) cua 1 restaurant. */
    RestaurantSubscriptionResponse getCurrentSubscription(Long restaurantId);

    /** Dang ky goi lan dau - tao subscription (PENDING_PAYMENT) + hoa don INITIAL (PENDING). */
    SubscriptionInvoiceResponse subscribeInitialPlan(Long restaurantId, SubscribeInitialPlanRequest request);

    /** Nang cap ngay - khong proration, thu du gia goi moi, chu ky tinh lai tu hom nay. */
    SubscriptionInvoiceResponse upgradePlan(Long restaurantId, UpgradePlanRequest request);

    /** Dat lich ha cap - khong doi snapshot ngay, chi ap dung vao ky gia han tiep theo. */
    RestaurantSubscriptionResponse scheduleDowngrade(Long restaurantId, ScheduleDowngradeRequest request);

    /** Huy lich ha cap da dat truoc do. */
    RestaurantSubscriptionResponse cancelScheduledDowngrade(Long restaurantId);

    /** Kiem tra con duoc them chi nhanh moi khong (dung cho FE hien canh bao som). */
    BranchLimitCheckResponse checkBranchLimit(Long restaurantId);

    /**
     * Bat buoc goi tu BranchService truoc khi tao chi nhanh moi - nem BusinessException
     * neu da dat/vuot han muc hoac chua co subscription hieu luc.
     */
    void assertCanAddBranch(Long restaurantId);

    List<SubscriptionInvoiceResponse> listInvoices(Long restaurantId);

    /**
     * Danh cho man Admin - xem hoa don cua TOAN HE THONG, kem ten nha hang.
     * @param statuses null/rong = lay tat ca; truyen vao vd [PENDING, OVERDUE] de
     *                 chi xem hoa don can xu ly (dung cho man "Cho xac nhan thanh toan").
     */
    List<AdminSubscriptionInvoiceResponse> listInvoicesForAdmin(List<InvoiceStatus> statuses);

    /**
     * CHUA tich hop payOS: dung tam de Admin xac nhan thanh toan thu cong trong
     * giai doan phat trien/test, ap dung dung logic snapshot nhu khi payOS xac nhan
     * that (idempotent - goi lai voi hoa don da PAID se khong lam gi them).
     */
    void markInvoicePaidManually(Long invoiceId);
}