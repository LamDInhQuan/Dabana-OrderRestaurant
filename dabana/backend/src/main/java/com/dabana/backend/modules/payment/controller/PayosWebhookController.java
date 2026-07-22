package com.dabana.backend.modules.payment.controller;

import com.dabana.backend.modules.payment.dto.webhook.PayosWebhookAckResponse;
import com.dabana.backend.modules.payment.service.PayosWebhookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class PayosWebhookController {

    private final PayosWebhookService payosWebhookService;

    public PayosWebhookController(PayosWebhookService payosWebhookService) {
        this.payosWebhookService = payosWebhookService;
    }

    /**
     * URL nay dang ky tren my.payos.vn (hoac qua client.webhooks().confirm(url))
     * cho TUNG kenh thanh toan cua TUNG branch. payOS luon mong HTTP 200 de
     * khong bi retry - loi xu ly noi bo duoc ghi vao pm_payos_webhook_logs
     * (processed=false) de xu ly lai sau, khong throw ra ngoai.
     */
    @PostMapping("/api/payment/payos/webhook")
    public PayosWebhookAckResponse receiveWebhook(@RequestBody String rawBody) {
        try {
            payosWebhookService.process(rawBody);
        } catch (Exception e) {
            log.error("Loi xu ly webhook payOS (da/se log vao pm_payos_webhook_logs)", e);
        }
        return PayosWebhookAckResponse.ok();
    }
}