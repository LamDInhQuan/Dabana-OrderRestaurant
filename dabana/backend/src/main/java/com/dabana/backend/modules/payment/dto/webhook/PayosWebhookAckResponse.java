package com.dabana.backend.modules.payment.dto.webhook;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response tra ve cho payOS sau khi nhan webhook, theo dung format payOS
 * mong doi de KHONG bi retry lai (error = "00" hoac 0 tuy version SDK -
 * can doi chieu lai tai lieu/thu that truoc khi dung).
 *
 * PayosWebhookController luon tra HTTP 200 + body nay ngay ca khi xu ly noi
 * bo that bai (vd DEPOSIT khong khop orderCode), de tranh payOS spam retry;
 * loi thuc te duoc ghi nhan qua PayosWebhookLog.processed = false de xu ly
 * lai thu cong/batch sau.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayosWebhookAckResponse {

    private String error;
    private String message;

    public static PayosWebhookAckResponse ok() {
        return new PayosWebhookAckResponse("00", "Success");
    }
}
