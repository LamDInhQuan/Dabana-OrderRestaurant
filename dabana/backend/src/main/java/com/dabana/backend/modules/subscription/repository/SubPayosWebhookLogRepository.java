package com.dabana.backend.modules.subscription.repository;

import com.dabana.backend.modules.subscription.entity.SubPayosWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubPayosWebhookLogRepository extends JpaRepository<SubPayosWebhookLog, Long> {
}
