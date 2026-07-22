package com.dabana.backend.modules.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class BranchBankAccountResponse {

    private Long id;
    private Long branchId;
    private BankCatalogResponse bank;
    private String accountNumber;
    private String accountName;

    private String payosClientId;
    /** true neu ca 3 field kenh THU da duoc cau hinh du. */
    private Boolean payosConfigured;

    private String payosPayoutClientId;
    /** true neu ca 3 field kenh CHI da duoc cau hinh du. */
    private Boolean payosPayoutConfigured;

    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}