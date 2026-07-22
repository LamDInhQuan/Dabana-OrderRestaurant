package com.dabana.backend.modules.payment.dto.webhook;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Phan "data" cua webhook payOS - khop truc tiep voi cac cot cua
 * PayosWebhookLog (xem comment tung field o entity do).
 *
 * transactionDateTime giu kieu String (payOS tra dang "yyyy-MM-dd HH:mm:ss")
 * roi de service tu parse sang LocalDateTime, tranh loi deserialize neu
 * dinh dang thuc te khac gia dinh.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayosWebhookData {

    private Long orderCode;
    private BigDecimal amount;
    private String description;
    private String accountNumber;
    private String reference;
    private String transactionDateTime;
    private String currency;
    private String paymentLinkId;
    private String code;
    private String desc;
    private String counterAccountBankId;
    private String counterAccountBankName;
    private String counterAccountName;
    private String counterAccountNumber;
    private String virtualAccountName;
    private String virtualAccountNumber;
}
