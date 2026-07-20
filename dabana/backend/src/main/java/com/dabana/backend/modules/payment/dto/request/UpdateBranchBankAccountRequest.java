package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request cap nhat tai khoan ngan hang cua branch (PATCH-style: tat ca truong
 * deu optional, null = giu nguyen gia tri cu, service chi ghi de field khac null).
 *
 * payosApiKey/payosChecksumKey neu duoc gui len (khac null) se duoc ma hoa
 * lai va GHI DE key cu; neu FE khong co nhu cau doi thi khong gui truong nay
 * len (vi BE khong the/khong nen tra plaintext ve de FE "giu nguyen roi gui lai").
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBranchBankAccountRequest {

    private Integer bankId;

    @Size(max = 50)
    private String accountNumber;

    @Size(max = 150)
    private String accountName;

    @Size(max = 255)
    private String payosClientId;

    private String payosApiKey;

    private String payosChecksumKey;

    private Boolean isActive;
}
