package com.dabana.backend.modules.subscription.mapper;

import com.dabana.backend.modules.subscription.dto.response.AdminSubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionInvoiceResponse;
import com.dabana.backend.modules.subscription.entity.SubscriptionInvoice;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionInvoiceMapper {

    public SubscriptionInvoiceResponse toResponse(SubscriptionInvoice invoice) {
        if (invoice == null) return null;
        return SubscriptionInvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceType(invoice.getInvoiceType())
                .planSnapshotName(invoice.getPlanSnapshotName())
                .amount(invoice.getAmount())
                .periodStart(invoice.getPeriodStart())
                .periodEnd(invoice.getPeriodEnd())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .paidAt(invoice.getPaidAt())
                .downgradeRenewal(invoice.getDowngradeRenewal())
                .build();
    }

    /** Dung rieng cho man Admin - kem theo thong tin nha hang so huu hoa don. */
    public AdminSubscriptionInvoiceResponse toAdminResponse(SubscriptionInvoice invoice) {
        if (invoice == null) return null;
        return AdminSubscriptionInvoiceResponse.builder()
                .id(invoice.getId())
                .restaurantId(invoice.getSubscription().getRestaurant().getId())
                .restaurantName(invoice.getSubscription().getRestaurant().getRestaurantName())
                .subscriptionStatus(invoice.getSubscription().getStatus())
                .invoiceType(invoice.getInvoiceType())
                .planSnapshotName(invoice.getPlanSnapshotName())
                .amount(invoice.getAmount())
                .periodStart(invoice.getPeriodStart())
                .periodEnd(invoice.getPeriodEnd())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .paidAt(invoice.getPaidAt())
                .downgradeRenewal(invoice.getDowngradeRenewal())
                .build();
    }
}