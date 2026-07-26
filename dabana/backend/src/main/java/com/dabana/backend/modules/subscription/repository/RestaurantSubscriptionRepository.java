package com.dabana.backend.modules.subscription.repository;

import com.dabana.backend.modules.subscription.entity.RestaurantSubscription;
import com.dabana.backend.modules.subscription.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RestaurantSubscriptionRepository extends JpaRepository<RestaurantSubscription, Long> {

    /**
     * Subscription dang hieu luc (ACTIVE hoac PAST_DUE - van con hieu luc trong
     * thoi gian an han) gan nhat cua 1 restaurant. Day la nguon DUY NHAT de doc
     * maxBranchesSnapshot phuc vu kiem tra han muc chi nhanh.
     */
    Optional<RestaurantSubscription> findFirstByRestaurant_IdAndStatusInOrderByCreatedAtDesc(
            Long restaurantId, List<SubscriptionStatus> statuses);

    /** Phuc vu scheduler gia han: sap den han, con auto renew. */
    List<RestaurantSubscription> findByStatusAndAutoRenewTrueAndCurrentPeriodEnd(
            SubscriptionStatus status, LocalDate periodEnd);

    /** Phuc vu scheduler xu ly qua han: het thoi gian an han. */
    List<RestaurantSubscription> findByStatusAndGracePeriodEndBefore(
            SubscriptionStatus status, LocalDate date);
}
