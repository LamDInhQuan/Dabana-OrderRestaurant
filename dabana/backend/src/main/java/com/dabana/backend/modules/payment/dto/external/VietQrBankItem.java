package com.dabana.backend.modules.payment.dto.external;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Mot ngan hang trong response cua VietQR - field name khop nguyen theo
 * VietQR (bin, code, name, shortName, logo, swift_code, transferSupported,
 * lookupSupported), day chinh la nguon du lieu upsert vao BankCatalog
 * (id giu nguyen tu VietQR, xem comment entity BankCatalog).
 *
 * "logo" cua VietQR duoc map sang logoUrl cua BankCatalog trong mapper/
 * job dong bo, khong doi ten o day de con doi chieu de dang voi payload goc.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VietQrBankItem {

    private Integer id;
    private String name;
    private String code;
    private String bin;
    private String shortName;
    private String logo;
    private Integer transferSupported; // VietQR tra 0/1, mapper tu convert sang Boolean
    private Integer lookupSupported;   // VietQR tra 0/1, mapper tu convert sang Boolean
    private String swiftCode;
}
