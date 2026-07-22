package com.dabana.backend.modules.payment.dto.webhook;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload payOS gui den webhook cua he thong (POST /confirm-webhook), theo
 * cau truc: https://payos.vn/docs/api/#tag/payment-webhook/operation/payment-webhook
 *
 * LUU Y: field name o day suy ra tu comment trong entity PayosWebhookLog +
 * tai lieu payOS cong khai, CHUA duoc doi chieu voi payload webhook that.
 * Can verify lai (vd log rawPayload that roi so sanh) truoc khi dung o
 * PayosWebhookController, vi payOS co the doi ten field giua cac phien ban API.
 *
 * signature dung de verify HMAC_SHA256 voi checksum key cua branch tuong
 * ung (xac dinh branch qua data.orderCode -> DepositPayment -> BranchBankAccount).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayosWebhookPayload {

    private String code;
    private String desc;
    private Boolean success;
    private PayosWebhookData data;
    private String signature;
}
