package com.dabana.backend.modules.subscription.repository;

import com.dabana.backend.modules.subscription.entity.SubscriptionInvoice;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionInvoiceRepository extends JpaRepository<SubscriptionInvoice, Long> {

    List<SubscriptionInvoice> findBySubscription_IdOrderByCreatedAtDesc(Long subscriptionId);

    /** Liet ke hoa don theo restaurant (khong phu thuoc subscription dang o trang thai nao). */
    List<SubscriptionInvoice> findBySubscription_Restaurant_IdOrderByCreatedAtDesc(Long restaurantId);

    /** Phuc vu man Admin: loc theo 1 hoac nhieu trang thai (vd PENDING, OVERDUE), moi nhat truoc. */
    List<SubscriptionInvoice> findByStatusInOrderByCreatedAtDesc(List<InvoiceStatus> statuses);

    /** Phuc vu man Admin: xem toan bo hoa don khi khong loc trang thai. */
    List<SubscriptionInvoice> findAllByOrderByCreatedAtDesc();

    Optional<SubscriptionInvoice> findFirstBySubscription_IdOrderByCreatedAtDesc(Long subscriptionId);

    /** Phuc vu scheduler: hoa don qua han thanh toan (due_date < hom nay, con PENDING). */
    List<SubscriptionInvoice> findByStatusAndDueDateBefore(InvoiceStatus status, LocalDate date);
}