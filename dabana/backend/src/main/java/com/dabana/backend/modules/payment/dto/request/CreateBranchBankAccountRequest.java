package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBranchBankAccountRequest {

    @NotNull
    private Long branchId;

    @NotNull
    private Integer bankId;

    @NotBlank
    @Size(max = 50)
    private String accountNumber;

    @NotBlank
    @Size(max = 150)
    private String accountName;

    // ---- Kenh THU (co the de trong, bo sung sau qua Update) ----
    @Size(max = 255)
    private String payosClientId;
    private String payosApiKey;
    private String payosChecksumKey;

    // ---- Kenh CHI - RIENG cua branch nay, KHONG dung chung toan he thong ----
    @Size(max = 255)
    private String payosPayoutClientId;
    private String payosPayoutApiKey;
    private String payosPayoutChecksumKey;
}