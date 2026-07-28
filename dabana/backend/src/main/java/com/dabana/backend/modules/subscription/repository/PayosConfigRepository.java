package com.dabana.backend.modules.subscription.repository;

import com.dabana.backend.modules.subscription.entity.PayosConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PayosConfigRepository extends JpaRepository<PayosConfig, Long> {

    /** Chi dung 1 dong duy nhat cho toan he thong - lay dong active tao som nhat. */
    Optional<PayosConfig> findFirstByIsActiveTrueOrderByIdAsc();
}
