package com.dabana.backend.modules.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response thong tin tai khoan khach nhap de nhan hoan tien coc.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class RefundBankInfoResponse {

    private Long id;
    private Long reservationId;
    private BankCatalogResponse bank;
    private String accountNumber;
    private String accountHolderName;
    private LocalDateTime createdAt;
}
