package com.dabana.backend.modules.payment.dto.response;

import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response lenh thu tien coc - dung ca cho luc vua tao link (FE can
 * checkoutUrl/qrCode de hien thi thanh toan) va cho luc tra cuu trang thai
 * sau nay (status/amountPaid/amountRemaining).
 *
 * bin/accountNumber/accountName o day la snapshot payOS tra ve luc tao link
 * (data.bin/data.accountNumber/data.accountName), KHAC voi tai khoan cau
 * hinh trong BranchBankAccount - xem comment entity DepositPayment.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class DepositPaymentResponse {

    private Long id;
    private Long reservationId;
    private Long orderCode;
    private BigDecimal amount;
    private String description;

    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;

    private String cancelUrl;
    private String returnUrl;
    private LocalDateTime expiredAt;

    private String payosPaymentLinkId;
    private String checkoutUrl;
    private String qrCode;
    private String bin;
    private String accountNumber;
    private String accountName;

    private DepositPaymentStatus status;
    private BigDecimal amountPaid;
    private BigDecimal amountRemaining;

    private String cancellationReason;
    private LocalDateTime canceledAt;
    private LocalDateTime paidAt;

    private LocalDateTime createdAt;
}
