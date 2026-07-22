package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Size(max = 255)
    private String payosPayoutClientId;
    private String payosPayoutApiKey;
    private String payosPayoutChecksumKey;

    private Boolean isActive;
}