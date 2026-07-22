package com.dabana.backend.modules.payment.mapper;

import com.dabana.backend.modules.payment.dto.response.BankCatalogResponse;
import com.dabana.backend.modules.payment.entity.BankCatalog;
import org.springframework.stereotype.Component;

@Component
public class BankCatalogMapper {

    public BankCatalogResponse toResponse(BankCatalog entity) {
        if (entity == null) {
            return null;
        }
        return BankCatalogResponse.builder()
                .id(entity.getId())
                .bin(entity.getBin())
                .code(entity.getCode())
                .name(entity.getName())
                .shortName(entity.getShortName())
                .logoUrl(entity.getLogoUrl())
                .swiftCode(entity.getSwiftCode())
                .transferSupported(entity.getTransferSupported())
                .lookupSupported(entity.getLookupSupported())
                .isActive(entity.getIsActive())
                .build();
    }
}
