package com.dabana.backend.modules.payment.mapper;

import com.dabana.backend.modules.payment.dto.response.BranchBankAccountResponse;
import com.dabana.backend.modules.payment.entity.BranchBankAccount;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class BranchBankAccountMapper {

    private final BankCatalogMapper bankCatalogMapper;

    public BranchBankAccountMapper(BankCatalogMapper bankCatalogMapper) {
        this.bankCatalogMapper = bankCatalogMapper;
    }

    public BranchBankAccountResponse toResponse(BranchBankAccount entity) {
        if (entity == null) {
            return null;
        }
        boolean payosConfigured = StringUtils.hasText(entity.getPayosClientId())
                && StringUtils.hasText(entity.getPayosApiKeyEncrypted())
                && StringUtils.hasText(entity.getPayosChecksumKeyEncrypted());

        boolean payosPayoutConfigured = StringUtils.hasText(entity.getPayosPayoutClientId())
                && StringUtils.hasText(entity.getPayosPayoutApiKeyEncrypted())
                && StringUtils.hasText(entity.getPayosPayoutChecksumKeyEncrypted());

        return BranchBankAccountResponse.builder()
                .id(entity.getId())
                .branchId(entity.getBranch() != null ? entity.getBranch().getId() : null)
                .bank(bankCatalogMapper.toResponse(entity.getBank()))
                .accountNumber(entity.getAccountNumber())
                .accountName(entity.getAccountName())
                .payosClientId(entity.getPayosClientId())
                .payosConfigured(payosConfigured)
                .payosPayoutClientId(entity.getPayosPayoutClientId())
                .payosPayoutConfigured(payosPayoutConfigured)
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}