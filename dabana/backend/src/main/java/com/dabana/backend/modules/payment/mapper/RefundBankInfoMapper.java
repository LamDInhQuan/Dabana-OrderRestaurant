package com.dabana.backend.modules.payment.mapper;

import com.dabana.backend.modules.payment.dto.response.RefundBankInfoResponse;
import com.dabana.backend.modules.payment.entity.RefundBankInfo;
import org.springframework.stereotype.Component;

@Component
public class RefundBankInfoMapper {

    private final BankCatalogMapper bankCatalogMapper;

    public RefundBankInfoMapper(BankCatalogMapper bankCatalogMapper) {
        this.bankCatalogMapper = bankCatalogMapper;
    }

    public RefundBankInfoResponse toResponse(RefundBankInfo entity) {
        if (entity == null) {
            return null;
        }
        return RefundBankInfoResponse.builder()
                .id(entity.getId())
                .reservationId(entity.getReservation() != null ? entity.getReservation().getId() : null)
                .bank(bankCatalogMapper.toResponse(entity.getBank()))
                .accountNumber(entity.getAccountNumber())
                .accountHolderName(entity.getAccountHolderName())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
