package com.dabana.backend.modules.subscription.controller;

import com.dabana.backend.modules.subscription.dto.webhook.SubPayosWebhookAckResponse;
import com.dabana.backend.modules.subscription.service.impl.SubPayosWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * URL nay can duoc dang ky voi payOS (qua PayosConfigService.saveConfig() ->
 * client.webhooks().confirm(), hoac thu cong tren my.payos.vn) TRO VE dung
 * duong dan nay. payOS luon mong HTTP 200 de khong bi retry - loi xu ly noi
 * bo duoc ghi vao sub_payos_webhook_logs (processed=false) de xu ly lai sau,
 * khong throw ra ngoai.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class SubPayosWebhookController {

    private final SubPayosWebhookService subPayosWebhookService;

    @PostMapping("/api/subscriptions/payos/webhook")
    public SubPayosWebhookAckResponse receiveWebhook(@RequestBody String rawBody) {
        try {
            subPayosWebhookService.process(rawBody);
        } catch (Exception e) {
            log.error("Loi xu ly webhook payOS subscription (da/se log vao sub_payos_webhook_logs)", e);
        }
        return SubPayosWebhookAckResponse.ok();
    }
}
