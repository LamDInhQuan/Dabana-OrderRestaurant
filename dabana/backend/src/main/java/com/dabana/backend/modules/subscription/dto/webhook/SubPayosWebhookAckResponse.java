package com.dabana.backend.modules.subscription.dto.webhook;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * payOS luon mong HTTP 200 + body nay de KHONG bi retry, ke ca khi xu ly noi bo
 * that bai (loi thuc te ghi vao sub_payos_webhook_logs.processed=false).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubPayosWebhookAckResponse {

    private String error;
    private String message;

    public static SubPayosWebhookAckResponse ok() {
        return new SubPayosWebhookAckResponse("00", "Success");
    }
}
