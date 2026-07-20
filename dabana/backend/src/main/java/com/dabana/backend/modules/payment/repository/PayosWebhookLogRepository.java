package com.dabana.backend.modules.payment.repository;

import com.dabana.backend.modules.payment.entity.PayosWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayosWebhookLogRepository extends JpaRepository<PayosWebhookLog, Long> {

    /** payOS co the goi lai webhook (retry) cho cung 1 orderCode - lay het de doi soat/tranh xu ly trung. */
    List<PayosWebhookLog> findAllByOrderCode(Long orderCode);

    List<PayosWebhookLog> findAllByDepositPayment_Id(Long depositPaymentId);
}