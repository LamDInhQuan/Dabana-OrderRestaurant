package com.dabana.backend.modules.subscription.util;

import com.dabana.backend.modules.subscription.enums.BillingCycle;

import java.time.LocalDate;

/** Tinh ngay ket thuc ky theo billing cycle - dung chung cho subscribe/upgrade/renew. */
public final class BillingCycleUtils {

    private BillingCycleUtils() {
    }

    public static LocalDate addOneCycle(LocalDate from, BillingCycle cycle) {
        return switch (cycle) {
            case MONTHLY -> from.plusMonths(1);
            case QUARTERLY -> from.plusMonths(3);
            case YEARLY -> from.plusYears(1);
        };
    }
}
