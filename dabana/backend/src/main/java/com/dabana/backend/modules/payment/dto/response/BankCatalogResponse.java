package com.dabana.backend.modules.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * Response danh muc ngan hang (read-only cho client - endpoint GET list /
 * GET detail, dung cho FE render dropdown chon ngan hang o man hinh nhap
 * tk hoan tien / cau hinh tk branch).
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class BankCatalogResponse {

    private Integer id;
    private String bin;
    private String code;
    private String name;
    private String shortName;
    private String logoUrl;
    private String swiftCode;
    private Boolean transferSupported;
    private Boolean lookupSupported;
    private Boolean isActive;
}
