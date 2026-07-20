package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Request tao lenh thu tien coc.
 *
 * Theo chot nghiep vu: FE CHI gui reservationId + amount. Cac truong con lai
 * cua DepositPayment (buyerName/buyerEmail/buyerPhone, cancelUrl/returnUrl,
 * description, branchBankAccount, orderCode...) deu do BE tu suy ra:
 * - buyerName/buyerEmail/buyerPhone: lay tu Booking (reservation).
 * - branchBankAccount: lay tu Branch cua reservation (BranchBankAccountRepository#findByBranch_Id).
 * - cancelUrl/returnUrl: lay tu config app (vd app.payment.cancel-url-template).
 * - orderCode: BE tu sinh (vd dua tren timestamp/sequence) vi phai la so nguyen duy nhat.
 * - description: BE tu dung (vd "Thanh toan coc dat ban #{reservationId}").
 *
 * Truoc khi tao, service can kiem tra existsByReservation_Id de tra loi
 * PaymentErrorCode.DEPOSIT_ALREADY_EXISTS neu da co lenh thu con hieu luc.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateDepositPaymentRequest {

    @NotNull
    private Long reservationId;

    /** payOS yeu cau so tien la so nguyen (VND) - khong nhan phan thap phan. */
    @NotNull
    @Positive
    @Digits(integer = 12, fraction = 0)
    private BigDecimal amount;
}
