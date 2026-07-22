package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request nhap thong tin tai khoan khach nhan hoan tien coc (khi khach huy
 * dat ban va du dieu kien hoan theo chinh sach huy cua branch).
 *
 * Dung chung cho ca tao moi va cap nhat (upsert theo UNIQUE reservation_id -
 * RefundBankInfoRepository#existsByReservation_Id): neu da ton tai thi
 * service update thay vi tra loi REFUND_BANK_INFO_ALREADY_EXISTS, tuy vao
 * flow (BE quyet dinh o service, DTO nay chi mang du lieu dau vao).
 *
 * bankId tham chieu BankCatalog.id (kieu Integer, giu nguyen theo VietQR -
 * xem BankCatalog#id).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefundBankInfoRequest {

    @NotNull
    private Long reservationId;

    @NotNull
    private Integer bankId;

    @NotBlank
    @Size(max = 50)
    private String accountNumber;

    @NotBlank
    @Size(max = 150)
    private String accountHolderName;
}
