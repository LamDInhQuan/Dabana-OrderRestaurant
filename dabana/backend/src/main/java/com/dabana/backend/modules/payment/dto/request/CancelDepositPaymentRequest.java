package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request huy lenh thu tien coc (nhan vien huy tay, hoac khach huy dat ban
 * truoc khi thanh toan).
 *
 * Service can validate status hien tai truoc khi huy:
 * - Neu status = PAID -> PaymentErrorCode.DEPOSIT_ALREADY_PAID.
 * - Neu status = CANCELLED/EXPIRED -> PaymentErrorCode.DEPOSIT_CANNOT_CANCEL.
 * Sau khi huy tren payOS thanh cong moi set canceledAt = now, status = CANCELLED.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CancelDepositPaymentRequest {

    @NotBlank
    @Size(max = 255)
    private String cancellationReason;
}
