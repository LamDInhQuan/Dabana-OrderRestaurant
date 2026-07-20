package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request tao lenh chi hoan coc.
 *
 * Theo chot nghiep vu: idempotencyKey/referenceId do BE tu sinh (UUID), KHONG
 * nhan tu FE. Cac truong con lai BE tu suy ra tu reservation:
 * - refundBankInfo: lay tu RefundBankInfoRepository#findByReservation_Id (bat
 *   buoc phai co truoc, neu khong -> REFUND_BANK_INFO_NOT_FOUND).
 * - sourceBranchBankAccount: lay tu Branch cua reservation.
 * - toBin/toAccountNumber: snapshot tu refundBankInfo.bank/accountNumber tai
 *   thoi diem tao lenh (entity da comment ro dieu nay).
 * - amount: thuong = DepositPayment.amountPaid cua reservation do (BE tu lay,
 *   khong nhan tu FE de tranh sai lech so tien hoan).
 *
 * description/category cho phep FE ghi de mo ta hien thi tren sao ke, neu bo
 * trong BE dung mac dinh (vd category = "refund_deposit").
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePayoutOrderRequest {

    @NotNull
    private Long reservationId;

    @Size(max = 255)
    private String description;

    @Size(max = 255)
    private String category;
}
