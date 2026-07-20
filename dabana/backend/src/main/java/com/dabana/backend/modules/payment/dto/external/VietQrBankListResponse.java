package com.dabana.backend.modules.payment.dto.external;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Wrapper response tu GET https://api.vietqr.io/v2/banks - dung noi bo cho
 * job dong bo BankCatalog (KHONG phai DTO tra ve client, client chi thay
 * BankCatalogResponse qua endpoint GET danh sach read-only).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VietQrBankListResponse {

    private Integer code;
    private String desc;
    private List<VietQrBankItem> data;
}
