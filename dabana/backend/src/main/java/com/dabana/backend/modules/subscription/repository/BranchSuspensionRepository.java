package com.dabana.backend.modules.subscription.repository;

import com.dabana.backend.modules.subscription.entity.BranchSuspension;
import com.dabana.backend.modules.subscription.enums.SuspensionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchSuspensionRepository extends JpaRepository<BranchSuspension, Long> {

    /**
     * Danh sach chi nhanh dang bi tam ngung do thieu phi cua 1 subscription, sap
     * xep theo thoi diem tam ngung GIAM DAN - phuc vu khoi phuc dung thu tu
     * "chi nhanh bi ngung SAU CUNG duoc khoi phuc TRUOC".
     */
    List<BranchSuspension> findBySubscription_IdAndStatusOrderBySuspendedAtDesc(
            Long subscriptionId, SuspensionStatus status);
}
